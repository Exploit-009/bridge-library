-- ===== helper: safe uuid cast used by storage folder policies =====
CREATE OR REPLACE FUNCTION public.try_uuid(t text) RETURNS uuid LANGUAGE plpgsql IMMUTABLE AS $$ BEGIN RETURN t::uuid; EXCEPTION WHEN others THEN RETURN NULL; END $$;
GRANT EXECUTE ON FUNCTION public.try_uuid(text) TO authenticated;

-- ===== class messages =====
CREATE TABLE public.class_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid(),
  recipient_id uuid,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.class_messages TO authenticated;
GRANT ALL ON public.class_messages TO service_role;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class people can read their messages" ON public.class_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR (recipient_id IS NULL AND (public.is_class_teacher(class_id) OR public.is_class_member(class_id))));
CREATE POLICY "class people can send messages" ON public.class_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND (public.is_class_teacher(class_id) OR public.is_class_member(class_id)));
CREATE POLICY "recipients can mark messages read" ON public.class_messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR (recipient_id IS NULL AND public.is_class_teacher(class_id))) WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.protect_class_message() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.class_id IS DISTINCT FROM OLD.class_id OR NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR NEW.body IS DISTINCT FROM OLD.body OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Only read status may change'; END IF; RETURN NEW; END $$;
CREATE TRIGGER protect_class_message BEFORE UPDATE ON public.class_messages FOR EACH ROW EXECUTE FUNCTION public.protect_class_message();

-- ===== class content (lessons, quizzes, resources) =====
CREATE TABLE public.class_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('lesson','quiz','resource')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text CHECK (char_length(body) <= 20000),
  questions jsonb,
  link_url text CHECK (link_url IS NULL OR link_url ~ '^https?://'),
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.class_content TO authenticated;
GRANT ALL ON public.class_content TO service_role;
ALTER TABLE public.class_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class people can read class content" ON public.class_content FOR SELECT TO authenticated
  USING (public.is_class_teacher(class_id) OR public.is_class_member(class_id));
CREATE POLICY "teachers can post class content" ON public.class_content FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_class_teacher(class_id));
CREATE POLICY "teachers can remove class content" ON public.class_content FOR DELETE TO authenticated
  USING (public.is_class_teacher(class_id));

-- ===== quiz answer keys (teacher only) =====
CREATE TABLE public.class_quiz_keys (content_id uuid PRIMARY KEY REFERENCES public.class_content(id) ON DELETE CASCADE, answers jsonb NOT NULL);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_quiz_keys TO authenticated;
GRANT ALL ON public.class_quiz_keys TO service_role;
ALTER TABLE public.class_quiz_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers hold their quiz keys" ON public.class_quiz_keys TO authenticated USING (EXISTS (SELECT 1 FROM public.class_content c WHERE c.id = content_id AND public.is_class_teacher(c.class_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.class_content c WHERE c.id = content_id AND public.is_class_teacher(c.class_id)));

CREATE FUNCTION public.extract_class_quiz_keys() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE question_item jsonb; keys jsonb; BEGIN IF NEW.kind='quiz' THEN IF NEW.questions IS NULL OR jsonb_array_length(NEW.questions) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'A quiz needs 1 to 50 questions'; END IF; FOR question_item IN SELECT value FROM jsonb_array_elements(NEW.questions) LOOP IF jsonb_typeof(question_item->'answer') IS DISTINCT FROM 'number' OR (question_item->>'answer')::integer < 0 OR (question_item->>'answer')::integer >= jsonb_array_length(question_item->'options') THEN RAISE EXCEPTION 'Invalid quiz answer'; END IF; END LOOP; SELECT jsonb_agg(a.item->'answer' ORDER BY a.ord) INTO keys FROM jsonb_array_elements(NEW.questions) WITH ORDINALITY a(item,ord); INSERT INTO public.class_quiz_keys VALUES(NEW.id,keys); UPDATE public.class_content SET questions=(SELECT jsonb_agg(a.item - 'answer' ORDER BY a.ord) FROM jsonb_array_elements(NEW.questions) WITH ORDINALITY a(item,ord)) WHERE id=NEW.id; END IF; RETURN NEW; END $$;
CREATE TRIGGER extract_class_quiz_keys AFTER INSERT ON public.class_content FOR EACH ROW EXECUTE FUNCTION public.extract_class_quiz_keys();

-- ===== quiz submissions (graded by the database) =====
CREATE TABLE public.class_quiz_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_id uuid NOT NULL REFERENCES public.class_content(id) ON DELETE CASCADE, student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, answers jsonb NOT NULL, score integer NOT NULL, total_questions integer NOT NULL, submitted_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.class_quiz_attempts TO authenticated;
GRANT ALL ON public.class_quiz_attempts TO service_role;
ALTER TABLE public.class_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scores and teacher views" ON public.class_quiz_attempts FOR SELECT TO authenticated USING (student_id=auth.uid() OR EXISTS(SELECT 1 FROM public.class_content c WHERE c.id=content_id AND public.is_class_teacher(c.class_id)));

CREATE FUNCTION public.submit_class_quiz(p_content uuid,p_answers jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.class_content; keys jsonb; n integer; earned integer:=0; i integer; result_id uuid; BEGIN SELECT * INTO c FROM public.class_content WHERE id=p_content AND kind='quiz'; IF auth.uid() IS NULL OR c.id IS NULL OR NOT public.is_class_member(c.class_id) THEN RAISE EXCEPTION 'Join this class to take its quiz'; END IF; SELECT answers INTO keys FROM public.class_quiz_keys WHERE content_id=p_content; n:=jsonb_array_length(c.questions); IF keys IS NULL OR jsonb_typeof(p_answers) IS DISTINCT FROM 'array' OR jsonb_array_length(p_answers)<>n THEN RAISE EXCEPTION 'Answer every question'; END IF; FOR i IN 0..n-1 LOOP IF jsonb_typeof(p_answers->i) IS DISTINCT FROM 'number' OR (p_answers->>i)::numeric <> trunc((p_answers->>i)::numeric) OR (p_answers->>i)::integer NOT BETWEEN 0 AND jsonb_array_length(c.questions->i->'options')-1 THEN RAISE EXCEPTION 'Invalid answer'; END IF; IF p_answers->i=keys->i THEN earned:=earned+1; END IF; END LOOP; INSERT INTO public.class_quiz_attempts(content_id,student_id,answers,score,total_questions) VALUES(p_content,auth.uid(),p_answers,earned,n) RETURNING id INTO result_id; RETURN jsonb_build_object('id',result_id,'score',earned,'total_questions',n); END $$;
REVOKE ALL ON FUNCTION public.submit_class_quiz(uuid,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.submit_class_quiz(uuid,jsonb) TO authenticated;

-- ===== class lesson progress + announcement reads =====
CREATE TABLE public.class_lesson_completions (content_id uuid NOT NULL REFERENCES public.class_content(id) ON DELETE CASCADE,student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(content_id,student_id));
GRANT SELECT,INSERT ON public.class_lesson_completions TO authenticated;
GRANT ALL ON public.class_lesson_completions TO service_role;
ALTER TABLE public.class_lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own class lesson progress" ON public.class_lesson_completions FOR SELECT TO authenticated USING(student_id=auth.uid() OR EXISTS(SELECT 1 FROM public.class_content c WHERE c.id=content_id AND public.is_class_teacher(c.class_id)));
CREATE POLICY "members complete class lessons" ON public.class_lesson_completions FOR INSERT TO authenticated WITH CHECK(student_id=auth.uid() AND EXISTS(SELECT 1 FROM public.class_content c WHERE c.id=content_id AND c.kind='lesson' AND public.is_class_member(c.class_id)));

CREATE TABLE public.class_message_reads(message_id uuid NOT NULL REFERENCES public.class_messages(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,PRIMARY KEY(message_id,user_id));
GRANT SELECT,INSERT ON public.class_message_reads TO authenticated;
GRANT ALL ON public.class_message_reads TO service_role;
ALTER TABLE public.class_message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own announcement reads" ON public.class_message_reads FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "members record announcement reads" ON public.class_message_reads FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.class_messages m WHERE m.id=message_id AND (m.recipient_id=auth.uid() OR (m.recipient_id IS NULL AND public.is_class_member(m.class_id)))));

-- ===== bookmarks, ratings, certificates =====
CREATE TABLE public.bridge_bookmarks (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,subject_id));
GRANT SELECT,INSERT,DELETE ON public.bridge_bookmarks TO authenticated; GRANT ALL ON public.bridge_bookmarks TO service_role;
ALTER TABLE public.bridge_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks" ON public.bridge_bookmarks FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

CREATE TABLE public.bridge_ratings (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, subject_id bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), PRIMARY KEY(user_id,subject_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bridge_ratings TO authenticated; GRANT ALL ON public.bridge_ratings TO service_role;
ALTER TABLE public.bridge_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ratings on enrolled subjects" ON public.bridge_ratings FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.course_enrollments e WHERE e.user_id=auth.uid() AND e.subject_id=bridge_ratings.subject_id));

CREATE TABLE public.bridge_certificates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, subject_id bigint NOT NULL REFERENCES public.subjects(id), learner_name text NOT NULL, subject_name text NOT NULL, issued_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,subject_id));
GRANT SELECT ON public.bridge_certificates TO authenticated; GRANT ALL ON public.bridge_certificates TO service_role;
ALTER TABLE public.bridge_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own certificates" ON public.bridge_certificates FOR SELECT TO authenticated USING(user_id=auth.uid());

-- ===== saved study conversations =====
CREATE TABLE public.bridge_study_threads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, title text NOT NULL DEFAULT 'Study conversation', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,DELETE ON public.bridge_study_threads TO authenticated; GRANT ALL ON public.bridge_study_threads TO service_role;
ALTER TABLE public.bridge_study_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own study threads" ON public.bridge_study_threads FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

CREATE TABLE public.bridge_study_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES public.bridge_study_threads(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, message_id text NOT NULL, message jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(thread_id,message_id));
GRANT SELECT,INSERT ON public.bridge_study_messages TO authenticated; GRANT ALL ON public.bridge_study_messages TO service_role;
ALTER TABLE public.bridge_study_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own study messages read" ON public.bridge_study_messages FOR SELECT TO authenticated USING(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.bridge_study_threads t WHERE t.id=thread_id AND t.user_id=auth.uid()));
CREATE POLICY "own study messages insert" ON public.bridge_study_messages FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.bridge_study_threads t WHERE t.id=thread_id AND t.user_id=auth.uid()));
CREATE INDEX bridge_study_messages_thread_time ON public.bridge_study_messages(thread_id,created_at);

-- ===== app actions =====
CREATE FUNCTION public.bridge_course_metrics() RETURNS TABLE(subject_id bigint,lesson_count bigint,student_count bigint,rating_count bigint,rating_average numeric) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT s.id,(SELECT count(*) FROM public.lessons l WHERE l.subject_id=s.id AND l.is_published),(SELECT count(*) FROM public.course_enrollments e WHERE e.subject_id=s.id),(SELECT count(*) FROM public.bridge_ratings r WHERE r.subject_id=s.id),(SELECT round(avg(r.rating),1) FROM public.bridge_ratings r WHERE r.subject_id=s.id) FROM public.subjects s; $$;
REVOKE ALL ON FUNCTION public.bridge_course_metrics() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.bridge_course_metrics() TO anon,authenticated;

CREATE FUNCTION public.bridge_issue_certificate(p_subject bigint) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; learner text; subject text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to continue.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.course_enrollments WHERE user_id=auth.uid() AND subject_id=p_subject) OR NOT EXISTS(SELECT 1 FROM public.lessons WHERE subject_id=p_subject AND is_published) OR EXISTS(SELECT 1 FROM public.lessons l WHERE l.subject_id=p_subject AND l.is_published AND NOT EXISTS(SELECT 1 FROM public.lesson_completions c WHERE c.lesson_id=l.id AND c.user_id=auth.uid())) THEN
 RAISE EXCEPTION 'Enroll and complete every published lesson before requesting your completion certificate.'; END IF;
 SELECT coalesce(nullif(full_name,''),'BridgeLIB learner') INTO learner FROM public.profiles WHERE id=auth.uid();
 SELECT name INTO subject FROM public.subjects WHERE id=p_subject;
 INSERT INTO public.bridge_certificates(user_id,subject_id,learner_name,subject_name) VALUES(auth.uid(),p_subject,coalesce(learner,'BridgeLIB learner'),subject) ON CONFLICT(user_id,subject_id) DO NOTHING;
 SELECT id INTO cid FROM public.bridge_certificates WHERE user_id=auth.uid() AND subject_id=p_subject; RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.bridge_issue_certificate(bigint) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.bridge_issue_certificate(bigint) TO authenticated;

CREATE FUNCTION public.bridge_my_certificates() RETURNS SETOF public.bridge_certificates LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT * FROM public.bridge_certificates WHERE user_id=auth.uid() ORDER BY issued_at DESC $$;
REVOKE ALL ON FUNCTION public.bridge_my_certificates() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.bridge_my_certificates() TO authenticated;

CREATE FUNCTION public.bridge_practice_feedback(p_question uuid,p_option text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to continue.'; END IF;
 SELECT jsonb_build_object('question_id',q.id,'correct_option',a.correct_option,'explanation',q.explanation,'is_correct',a.correct_option=p_option) INTO result FROM public.exam_questions q JOIN public.exam_question_answers a ON a.question_id=q.id WHERE q.id=p_question AND q.is_published AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=p_option);
 IF result IS NULL THEN RAISE EXCEPTION 'Question unavailable.'; END IF; RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.bridge_practice_feedback(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.bridge_practice_feedback(uuid,text) TO authenticated;

-- ===== file storage rules for profile photos and class resources =====
CREATE POLICY "owners upload their own photo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "owners read their own photo" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "owners delete their own photo" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "teachers upload class resources" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'class-resources' AND public.is_class_teacher(public.try_uuid((storage.foldername(name))[1])));
CREATE POLICY "class people read class resources" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'class-resources' AND (public.is_class_teacher(public.try_uuid((storage.foldername(name))[1])) OR public.is_class_member(public.try_uuid((storage.foldername(name))[1]))));
CREATE POLICY "teachers delete class resources" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'class-resources' AND public.is_class_teacher(public.try_uuid((storage.foldername(name))[1])));