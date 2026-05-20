
## Goal
Make signup compliant for minors (10–18, India): collect student + parent details, verify parent mobile via MSG91 OTP (+91, 10 digits), and require parent consent + T&C acceptance before account creation.

## 1. Database (migration)
Extend `profiles` with compliance columns:
- `date_of_birth` (date, not null for new signups)
- `student_full_name`, `student_email` (nullable), `student_phone` (nullable, 10-digit IN)
- `parent_full_name`, `parent_email`, `parent_mobile` (10-digit IN, not null)
- `parent_mobile_verified_at` (timestamptz)
- `parent_consent_accepted_at`, `terms_accepted_at`, `privacy_accepted_at` (timestamptz)
- `consent_ip`, `consent_user_agent` (audit trail)

New table `otp_verifications` (server-only, no client RLS read):
- `id`, `mobile` (E.164 +91XXXXXXXXXX), `purpose` ('parent_signup'), `request_id` (MSG91), `attempts`, `verified_at`, `expires_at`, `created_at`
- RLS: deny all to authenticated; only service role writes (server fn uses admin client).

Validation trigger on `profiles`: reject insert/update where `date_of_birth` implies age <10 or >18, and where parent fields missing.

## 2. MSG91 server functions (`src/lib/msg91.functions.ts`)
Using `MSG91_AUTH_KEY` + `MSG91_OTP_TEMPLATE_ID` (already saved as secrets). Calls are server-only via `createServerFn`, no client exposure.

- `sendParentOtp({ mobile })` — validates 10-digit IN number, rate-limits (1 per 60s per mobile via `otp_verifications`), POSTs `https://control.msg91.com/api/v5/otp?template_id=...&mobile=91XXXXXXXXXX&otp_length=6&otp_expiry=10`, stores `request_id`.
- `verifyParentOtp({ mobile, otp })` — GETs `https://control.msg91.com/api/v5/otp/verify?mobile=91X...&otp=XXXXXX`, marks `verified_at`. Max 5 attempts.
- `resendParentOtp({ mobile })` — POST `/api/v5/otp/retry?retrytype=text`.

## 3. Signup flow rewrite (`src/routes/signup.tsx`)
Three-step wizard inside existing `AuthShell` (no new auth shell):

**Step 1 — Student info**
- Role selector (student / parent / teacher) [teacher/parent skip to old flow]
- Student full name *, DOB * (date picker, must compute age 10–18), student email (optional), student phone (optional, 10-digit IN)

**Step 2 — Parent info + OTP**
- Parent full name *, parent email *, parent mobile * (+91 prefix, 10 digits)
- "Send OTP" → calls `sendParentOtp`
- 6-digit OTP input (using existing `ui/input-otp`), Verify + Resend (60s cooldown)
- Must show "verified ✓" before continuing

**Step 3 — Consent + password**
- Password (existing strength meter)
- Checkboxes (all required): "I am the parent/legal guardian of the student", "I accept the Terms of Service", "I accept the Privacy Policy & consent to processing my child's data per DPDP Act 2023"
- Submit → `supabase.auth.signUp` with user_metadata containing all fields + `parent_mobile_verified: true` flag → server-side trigger writes to profiles

Teacher/parent self-signup: keep current simple flow (no minor compliance).

## 4. Files touched
- `supabase/migrations/...` (new)
- `src/lib/msg91.functions.ts` (new)
- `src/lib/schemas.ts` (add IN mobile + DOB schemas)
- `src/routes/signup.tsx` (rewrite for student role; keep current path for teacher/parent)
- `src/components/auth/AuthField.tsx` (small: optional suffix slot for "+91" prefix) — only if needed

## Notes
- DPDP Act 2023 compliance: verifiable parental consent + audit trail (IP, UA, timestamp).
- MSG91 secrets stay server-side only; never imported in client code.
- Existing `handle_new_user()` trigger will be updated to copy new metadata fields into profiles.
