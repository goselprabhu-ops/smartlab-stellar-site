import { z } from "zod";

export const appRoleSchema = z.enum(["student", "parent", "admin"]);
export const questionTypeSchema = z.enum(["mcq", "multi", "short"]);

export const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  full_name: z.string().trim().min(1).max(100),
  role: z.enum(["student", "parent"]).default("student"),
  grade: z.string().trim().max(20).optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const courseSchema = z.object({
  id: z.string().uuid().optional(),
  subject_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  grade: z.string().trim().max(20).optional().nullable(),
  cover_url: z.string().url().max(500).optional().nullable(),
  published: z.boolean().default(false),
});
export type CourseInput = z.infer<typeof courseSchema>;

export const lessonSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  content_md: z.string().max(20000).optional().nullable(),
  video_url: z.string().url().max(500).optional().nullable(),
  order_index: z.number().int().min(0).default(0),
});
export type LessonInput = z.infer<typeof lessonSchema>;

export const quizSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid().nullable().optional(),
  lesson_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  time_limit_seconds: z.number().int().min(0).max(7200).nullable().optional(),
});
export type QuizInput = z.infer<typeof quizSchema>;

export const questionSchema = z.object({
  id: z.string().uuid().optional(),
  quiz_id: z.string().uuid(),
  prompt: z.string().trim().min(1).max(1000),
  type: questionTypeSchema,
  options: z.array(z.string().max(500)).max(10).default([]),
  correct: z.array(z.union([z.string(), z.number()])).max(10).default([]),
  points: z.number().int().min(1).max(100).default(1),
  order_index: z.number().int().min(0).default(0),
});
export type QuestionInput = z.infer<typeof questionSchema>;

export const submitAttemptSchema = z.object({
  quiz_id: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.union([z.string(), z.array(z.string())])),
});
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
