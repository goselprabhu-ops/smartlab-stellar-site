import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  grade: z.enum(["6", "7", "8", "9", "10", "11", "12", "parent", "school"]),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      grade: data.grade,
      message: data.message,
    });
    if (error) {
      console.error("Contact insert failed:", error);
      throw new Error("Could not save your message. Please try again.");
    }
    return { ok: true as const };
  });
