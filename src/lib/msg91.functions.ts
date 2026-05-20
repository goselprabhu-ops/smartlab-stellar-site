import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// India only: 10-digit mobile starting with 6-9
const inMobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit OTP");

const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

function toE164(mobile: string) {
  return `91${mobile}`;
}

type MSG91Response = { type?: string; message?: string; request_id?: string };

async function msg91Fetch(url: string, init?: RequestInit): Promise<MSG91Response> {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) throw new Error("MSG91_AUTH_KEY is not configured");
  const res = await fetch(url, {
    ...init,
    headers: {
      authkey: authKey,
      "Content-Type": "application/json",
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: MSG91Response = {};
  try {
    json = text ? (JSON.parse(text) as MSG91Response) : {};
  } catch {
    json = { type: "error", message: text };
  }
  if (!res.ok || json.type === "error") {
    throw new Error(json.message || `MSG91 request failed (${res.status})`);
  }
  return json;
}

export const sendParentOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ mobile: inMobileSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const e164 = toE164(data.mobile);

    // Cooldown check
    const { data: recent } = await supabaseAdmin
      .from("otp_verifications")
      .select("id, last_sent_at")
      .eq("mobile", e164)
      .eq("purpose", "parent_signup")
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.last_sent_at) {
      const elapsed = Date.now() - new Date(recent.last_sent_at).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new Error(`Please wait ${wait}s before requesting another OTP.`);
      }
    }

    const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
    if (!templateId) throw new Error("MSG91_OTP_TEMPLATE_ID is not configured");

    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
      templateId,
    )}&mobile=${e164}&otp_length=6&otp_expiry=10`;
    const result = await msg91Fetch(url, { method: "POST", body: "{}" });

    await supabaseAdmin.from("otp_verifications").insert({
      mobile: e164,
      purpose: "parent_signup",
      request_id: result.request_id ?? null,
      attempts: 0,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      last_sent_at: new Date().toISOString(),
    });

    return { ok: true };
  });

export const resendParentOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ mobile: inMobileSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const e164 = toE164(data.mobile);

    const { data: recent } = await supabaseAdmin
      .from("otp_verifications")
      .select("id, last_sent_at")
      .eq("mobile", e164)
      .eq("purpose", "parent_signup")
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recent) {
      throw new Error("No active OTP request. Please request a new one.");
    }
    const elapsed = Date.now() - new Date(recent.last_sent_at).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new Error(`Please wait ${wait}s before resending.`);
    }

    const url = `https://control.msg91.com/api/v5/otp/retry?retrytype=text&mobile=${e164}`;
    await msg91Fetch(url, { method: "GET" });

    await supabaseAdmin
      .from("otp_verifications")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("id", recent.id);

    return { ok: true };
  });

export const verifyParentOtp = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ mobile: inMobileSchema, otp: otpSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const e164 = toE164(data.mobile);

    const { data: row } = await supabaseAdmin
      .from("otp_verifications")
      .select("id, attempts, expires_at, verified_at")
      .eq("mobile", e164)
      .eq("purpose", "parent_signup")
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) {
      throw new Error("No active OTP request. Please request a new one.");
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("OTP has expired. Please request a new one.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new Error("Too many attempts. Please request a new OTP.");
    }

    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${e164}&otp=${data.otp}`;
    try {
      await msg91Fetch(url, { method: "GET" });
    } catch (err) {
      await supabaseAdmin
        .from("otp_verifications")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw err instanceof Error ? err : new Error("OTP verification failed");
    }

    await supabaseAdmin
      .from("otp_verifications")
      .update({ verified_at: new Date().toISOString(), attempts: row.attempts + 1 })
      .eq("id", row.id);

    return { ok: true, verified: true };
  });

/**
 * Server-side check: was this mobile verified in the last 30 minutes?
 * Called during signup submission to prevent client-side spoofing of the
 * "parent_mobile_verified" flag.
 */
export const checkParentOtpVerified = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ mobile: inMobileSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const e164 = toE164(data.mobile);
    const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
    const { data: row } = await supabaseAdmin
      .from("otp_verifications")
      .select("id, verified_at")
      .eq("mobile", e164)
      .eq("purpose", "parent_signup")
      .not("verified_at", "is", null)
      .gte("verified_at", cutoff)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { verified: Boolean(row) };
  });
