-- AI Tutor: threaded chat sessions per student
CREATE TABLE public.chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  subject TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads: student read"   ON public.chat_threads FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Threads: student insert" ON public.chat_threads FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Threads: student update" ON public.chat_threads FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Threads: student delete" ON public.chat_threads FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "Threads: admin read"     ON public.chat_threads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX chat_threads_student_recent_idx ON public.chat_threads (student_id, last_message_at DESC);

CREATE TRIGGER chat_threads_updated_at
BEFORE UPDATE ON public.chat_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Messages within a chat thread
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL DEFAULT '',
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Msgs: student read"   ON public.chat_messages FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Msgs: student insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Msgs: student delete" ON public.chat_messages FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "Msgs: admin read"     ON public.chat_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX chat_messages_thread_idx ON public.chat_messages (thread_id, created_at);