import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Placeholder AI recommendation engine.
 * Returns canned suggestions. Wire to Lovable AI Gateway later for real personalization.
 */
export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("score, total, quizzes(title, course_id, courses(title))")
      .eq("student_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(5);

    const weak = (attempts ?? []).filter(
      (a) => a.total > 0 && a.score / a.total < 0.6,
    );

    const items = [
      {
        id: "rec-1",
        kind: "revision",
        title: weak[0]?.quizzes?.title
          ? `Revise: ${weak[0].quizzes.title}`
          : "Revise Algebra · Linear Equations",
        reason: weak[0]
          ? "Recent attempt scored below 60% — a short revision will lock the basics in."
          : "Spaced revision keeps long-term recall strong.",
        cta: "Start revision",
      },
      {
        id: "rec-2",
        kind: "practice",
        title: "Practice quiz: Light & Reflection",
        reason: "Boost concept mastery with a 10-minute targeted set.",
        cta: "Take quiz",
      },
      {
        id: "rec-3",
        kind: "concept",
        title: "Concept deep-dive: Photosynthesis",
        reason: "Recommended next concept based on your study plan.",
        cta: "Open lesson",
      },
    ];

    return { items, model: "placeholder-v1" };
  });
