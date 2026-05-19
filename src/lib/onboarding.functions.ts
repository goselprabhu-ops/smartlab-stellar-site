import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const prefsSchema = z.object({
  grade: z.string().min(1).max(20),
  board: z.enum(["CBSE", "ICSE", "State", "IB", "IGCSE", "Other"]),
  subjects: z.array(z.string().min(1).max(50)).min(1).max(12),
  goals: z.array(z.string().min(1).max(50)).min(1).max(8),
  weak_areas: z.array(z.string().min(1).max(80)).max(20),
  study_minutes_per_day: z.number().int().min(10).max(360),
  preferred_time: z.enum(["morning", "afternoon", "evening", "night"]),
  learning_style: z.enum(["visual", "reading", "practice", "mixed"]),
});

export type OnboardingPrefs = z.infer<typeof prefsSchema>;

export const generateStudyPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => prefsSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;

    const fallback = {
      summary: `A focused ${data.study_minutes_per_day}-minute daily plan for Class ${data.grade} (${data.board}).`,
      focus_subjects: data.subjects.slice(0, 3),
      weekly_plan: data.subjects.slice(0, 5).map((s, i) => ({
        day: ["Mon", "Tue", "Wed", "Thu", "Fri"][i] ?? `Day ${i + 1}`,
        subject: s,
        topic: `Foundation • ${s}`,
        minutes: Math.round(data.study_minutes_per_day / Math.min(5, data.subjects.length || 1)),
      })),
      first_week_goals: data.goals.slice(0, 3).map((g) => `Make measurable progress on: ${g}`),
      tips: [
        `Best results in your ${data.preferred_time} window — protect that slot.`,
        `Pair short ${data.learning_style} sessions with active recall.`,
      ],
    };

    type StudyPath = typeof fallback;
    let path: StudyPath = fallback;
    let model = "fallback";

    if (key) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content:
                  "You are an EdTech study coach for Indian K-12 students. Return concise JSON only.",
              },
              {
                role: "user",
                content: `Build a personalized weekly study path. Respond as JSON with fields: summary (string), focus_subjects (string[]), weekly_plan (array of {day, subject, topic, minutes}), first_week_goals (string[]), tips (string[]). Student: ${JSON.stringify(
                  data,
                )}`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const txt = json?.choices?.[0]?.message?.content;
          if (typeof txt === "string") {
            try {
              path = JSON.parse(txt) as StudyPath;
              model = "google/gemini-3-flash-preview";
            } catch {
              /* keep fallback */
            }
          }
        }
      } catch {
        /* keep fallback */
      }
    }

    // Persist preferences on profile (grade only — extra prefs go to ai_recommendations payload)
    await supabase
      .from("profiles")
      .upsert({ user_id: userId, grade: data.grade }, { onConflict: "user_id" });

    const { error } = await supabase.from("ai_recommendations").insert({
      student_id: userId,
      model,
      payload: JSON.parse(JSON.stringify({ kind: "onboarding_study_path", prefs: data, path })),
    });
    if (error) throw new Error(error.message);

    return { path, model };
  });
