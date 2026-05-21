import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const SYNTHETIC_DOMAIN = "accounts.smartlabonline.com";
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/;
const PASSWORD_RESET_QUEUE = "transactional";

function syntheticEmail(username: string) {
  return `${username.toLowerCase()}@${SYNTHETIC_DOMAIN}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 18) || "user";
}

async function isUsernameTaken(username: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .ilike("username", username)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/** Suggest an available username from first + last name. */
export const suggestUsername = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        first_name: z.string().trim().max(50),
        last_name: z.string().trim().max(50).optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const base = slugify(`${data.first_name}.${data.last_name}`).slice(0, 18);
    if (USERNAME_RE.test(base) && !(await isUsernameTaken(base))) {
      return { username: base };
    }
    for (let i = 1; i < 200; i++) {
      const candidate = `${base}${i}`.slice(0, 20);
      if (USERNAME_RE.test(candidate) && !(await isUsernameTaken(candidate))) {
        return { username: candidate };
      }
    }
    // Fallback: random suffix
    return { username: `${base}${Math.floor(Math.random() * 9999)}`.slice(0, 20) };
  });

/** Check whether a username is available. */
export const checkUsername = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ username: z.string().trim() }).parse(input))
  .handler(async ({ data }) => {
    const u = data.username.trim();
    if (!USERNAME_RE.test(u)) {
      return { available: false, reason: "Use 3–20 letters, numbers, . _ -" };
    }
    const taken = await isUsernameTaken(u);
    return { available: !taken, reason: taken ? "Already taken" : undefined };
  });

/**
 * Resolve a username (or email) to the actual auth email used to sign in.
 * Returns the email even if the account doesn't exist — login attempt will
 * fail naturally to avoid user enumeration timing.
 */
export const resolveLoginIdentity = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ identifier: z.string().trim().min(1).max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const id = data.identifier.trim();
    if (id.includes("@")) {
      // Could already be a real email — try to find the profile that owns it
      // (in case parent/teacher signed up with their real email and never
      // got a synthetic one).
      return { email: id };
    }
    if (!USERNAME_RE.test(id)) {
      throw new Error("Invalid username");
    }
    const { data: prof, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .ilike("username", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!prof) {
      // Return synthetic email — sign-in will fail with "invalid credentials"
      return { email: syntheticEmail(id) };
    }
    const { data: u, error: uErr } = await supabaseAdmin.auth.admin.getUserById(
      prof.user_id,
    );
    if (uErr || !u.user?.email) {
      return { email: syntheticEmail(id) };
    }
    return { email: u.user.email };
  });

const signupSchema = z.object({
  username: z.string().trim().regex(USERNAME_RE),
  password: z.string().min(8).max(72),
  student_full_name: z.string().trim().min(2).max(100),
  date_of_birth: z.string().min(1),
  student_email: z.string().email().optional().or(z.literal("")),
  student_phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
  parent_full_name: z.string().trim().min(2).max(100),
  parent_email: z.string().trim().email(),
  parent_mobile: z.string().regex(/^[6-9]\d{9}$/),
  class_id: z.string().uuid(),
  board: z.enum(["CBSE", "ICSE", "State", "IB", "IGCSE", "Other"]),
  stream: z.enum(["science", "commerce", "humanities"]).optional().or(z.literal("")),
  consent_user_agent: z.string().max(500).optional(),
});

/** Create a student account using a username (no email required). */
export const signupStudentWithUsername = createServerFn({ method: "POST" })
  .inputValidator((input) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    if (await isUsernameTaken(data.username)) {
      throw new Error("Username already taken");
    }
    const email = syntheticEmail(data.username);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        username: data.username,
        full_name: data.student_full_name,
        student_full_name: data.student_full_name,
        student_email: data.student_email || null,
        student_phone: data.student_phone || null,
        date_of_birth: data.date_of_birth,
        parent_full_name: data.parent_full_name,
        parent_email: data.parent_email,
        parent_mobile: data.parent_mobile,
        class_id: data.class_id,
        board: data.board,
        stream: data.stream || null,
        parent_consent: true,
        terms_accepted: true,
        privacy_accepted: true,
        consent_user_agent: data.consent_user_agent,
      },
    });

    if (error || !created.user) throw new Error(error?.message ?? "Signup failed");
    return { email, user_id: created.user.id };
  });

/** Forgot password: looks up parent_email, generates a recovery link, emails it. */
export const forgotPasswordByUsername = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ identifier: z.string().trim().min(1).max(255) }).parse(input),
  )
  .handler(async ({ data }) => {
    const id = data.identifier.trim();

    let userId: string | null = null;
    let parentEmail: string | null = null;
    let authEmail: string | null = null;

    if (id.includes("@")) {
      // Treat as email — find profile by parent_email OR by auth user email
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("user_id, parent_email, username")
        .ilike("parent_email", id)
        .maybeSingle();
      if (prof) {
        userId = prof.user_id;
        parentEmail = prof.parent_email;
      } else {
        authEmail = id;
        parentEmail = id;
      }
    } else {
      if (!USERNAME_RE.test(id)) throw new Error("Invalid username");
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("user_id, parent_email, username")
        .ilike("username", id)
        .maybeSingle();
      if (!prof) {
        // Don't leak — return success
        return { ok: true };
      }
      userId = prof.user_id;
      parentEmail = prof.parent_email;
    }

    if (userId && !authEmail) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      authEmail = u.user?.email ?? null;
    }

    if (!authEmail || !parentEmail) {
      // No recovery channel — silently succeed to prevent enumeration
      return { ok: true };
    }

    const siteUrl =
      process.env.SITE_URL ?? "https://smartlab-stellar-site.lovable.app";

    const { data: link, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: authEmail,
        options: { redirectTo: `${siteUrl}/reset-password` },
      });
    if (linkErr) throw new Error(linkErr.message);

    const actionLink = link.properties?.action_link;
    if (!actionLink) return { ok: true };

    // Enqueue email to parent_email via the existing email pipeline
    await supabaseAdmin.rpc("enqueue_email", {
      queue_name: PASSWORD_RESET_QUEUE,
      payload: {
        to: parentEmail,
        subject: "Reset your Smart Lab Online password",
        label: "password_reset",
        message_id: crypto.randomUUID(),
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
          <h1 style="font-size:20px;margin:0 0 12px">Reset your password</h1>
          <p>We received a request to reset the password for your Smart Lab Online account.</p>
          <p style="margin:24px 0">
            <a href="${actionLink}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Set new password</a>
          </p>
          <p style="font-size:13px;color:#475569">This link expires in 60 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>`,
      } as any,
    } as any);

    return { ok: true };
  });

/** Forgot username: emails the list of usernames registered to a parent email. */
export const forgotUsername = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ parent_email: z.string().trim().email() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("username, student_full_name, full_name")
      .ilike("parent_email", data.parent_email)
      .not("username", "is", null);

    if (!rows || rows.length === 0) {
      // Silent success to prevent enumeration
      return { ok: true };
    }

    const items = rows
      .map(
        (r: any) =>
          `<li><strong>${r.username}</strong>${
            r.student_full_name ? ` — ${r.student_full_name}` : r.full_name ? ` — ${r.full_name}` : ""
          }</li>`,
      )
      .join("");

    await supabaseAdmin.rpc("enqueue_email", {
      queue_name: PASSWORD_RESET_QUEUE,
      payload: {
        to: data.parent_email,
        subject: "Your Smart Lab Online username",
        label: "username_recovery",
        message_id: crypto.randomUUID(),
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
          <h1 style="font-size:20px;margin:0 0 12px">Your username${rows.length > 1 ? "s" : ""}</h1>
          <p>Here ${rows.length > 1 ? "are the usernames" : "is the username"} registered with this email:</p>
          <ul style="font-size:16px;line-height:1.8">${items}</ul>
          <p style="font-size:13px;color:#475569;margin-top:24px">Sign in at <a href="https://smartlab-stellar-site.lovable.app/login">smartlabonline.com</a>. If you didn't request this, you can ignore this email.</p>
        </div>`,
      } as any,
    } as any);

    return { ok: true };
  });
