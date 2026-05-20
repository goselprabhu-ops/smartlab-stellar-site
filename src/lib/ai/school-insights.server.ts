/**
 * School insights — server-only AI summarization of institution health.
 * Pulls light aggregates (members, batches, attendance, mastery, assignments)
 * and produces a short narrative + structured payload.
 */
import { aiJson } from "@/lib/ai-gateway.server";

export type SchoolSnapshot = {
  schoolName: string;
  students: number;
  teachers: number;
  batches: number;
  attendance30dPct: number | null;
  avgMasteryPct: number | null;
  assignmentsPublished: number;
  submissionRatePct: number | null;
  topBatches: Array<{ name: string; masteryPct: number; attendancePct: number | null }>;
  atRiskCount: number;
};

export type SchoolInsightsPayload = {
  headline: string;
  summary: string;
  highlights: string[];
  risks: string[];
  actions: string[];
  generatedAt: string;
  snapshot: SchoolSnapshot;
};

export async function narrateSchoolInsights(
  snapshot: SchoolSnapshot,
): Promise<SchoolInsightsPayload> {
  const generatedAt = new Date().toISOString();
  try {
    const out = await aiJson<{
      headline: string; summary: string;
      highlights: string[]; risks: string[]; actions: string[];
    }>(
      [
        {
          role: "system",
          content:
            "You are an education analytics writer for school leaders. Reply with strict JSON: {headline, summary, highlights[], risks[], actions[]}. Tone: warm, specific, action-oriented. Avoid jargon. Max 3 items per array.",
        },
        {
          role: "user",
          content:
            "Write a weekly insights brief for this school snapshot:\n" +
            JSON.stringify(snapshot, null, 2),
        },
      ],
      "google/gemini-2.5-flash",
    );
    return {
      headline: out.headline ?? `${snapshot.schoolName} — this week`,
      summary: out.summary ?? "",
      highlights: out.highlights ?? [],
      risks: out.risks ?? [],
      actions: out.actions ?? [],
      generatedAt,
      snapshot,
    };
  } catch {
    // Deterministic fallback if AI is unavailable
    const highlights: string[] = [];
    const risks: string[] = [];
    const actions: string[] = [];
    if (snapshot.attendance30dPct != null) {
      (snapshot.attendance30dPct >= 90 ? highlights : risks).push(
        `Attendance: ${snapshot.attendance30dPct}% (last 30 days)`,
      );
    }
    if (snapshot.avgMasteryPct != null) {
      (snapshot.avgMasteryPct >= 65 ? highlights : risks).push(
        `Average mastery: ${snapshot.avgMasteryPct}%`,
      );
    }
    if (snapshot.atRiskCount > 0) {
      risks.push(`${snapshot.atRiskCount} student(s) flagged at-risk`);
      actions.push("Schedule 1:1 check-ins with at-risk students this week.");
    }
    if (snapshot.submissionRatePct != null && snapshot.submissionRatePct < 60) {
      actions.push("Send assignment reminders to batches under 60% submission rate.");
    }
    return {
      headline: `${snapshot.schoolName} — weekly brief`,
      summary:
        "AI narration unavailable — showing computed snapshot. Reconnect AI to enable full narrative.",
      highlights, risks, actions, generatedAt, snapshot,
    };
  }
}
