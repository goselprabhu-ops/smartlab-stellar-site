import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export type ClassRow = { id: string; label: string; order_index: number };

export type RegistrationOptions = {
  boards: string[];
  classesByBoard: Record<string, ClassRow[]>;
};

/**
 * Public read: only returns boards/classes/subjects that actually have
 * at least one published chapter. Used by the signup wizard and onboarding.
 */
export const getRegistrationOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<RegistrationOptions> => {
    const { data, error } = await supabase.rpc("available_content_tree");
    if (error) throw new Error(error.message);

    const boardsSet = new Set<string>();
    const classesByBoard: Record<string, Map<string, ClassRow>> = {};

    for (const row of (data ?? []) as Array<{
      board: string;
      class_id: string;
      class_label: string;
      class_order: number;
    }>) {
      boardsSet.add(row.board);
      const m = (classesByBoard[row.board] ??= new Map());
      if (!m.has(row.class_id)) {
        m.set(row.class_id, {
          id: row.class_id,
          label: row.class_label,
          order_index: row.class_order,
        });
      }
    }

    return {
      boards: Array.from(boardsSet).sort(),
      classesByBoard: Object.fromEntries(
        Object.entries(classesByBoard).map(([b, m]) => [
          b,
          Array.from(m.values()).sort((a, b) => a.order_index - b.order_index),
        ]),
      ),
    };
  },
);
