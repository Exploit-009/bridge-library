CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  meta_path text := NEW.raw_user_meta_data ->> 'learner_path';
  meta_level text := NEW.raw_user_meta_data ->> 'education_level';
  meta_year text := NEW.raw_user_meta_data ->> 'target_exam_year';
BEGIN
  INSERT INTO public.profiles (
    id, full_name, learner_path, education_level, grade_level,
    target_exam_year, onboarding_completed
  )
  VALUES (
    NEW.id,
    NULLIF(LEFT(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), 160), ''),
    CASE WHEN meta_path IN ('school_learner','wassce_candidate','independent_learner') THEN meta_path ELSE NULL END,
    CASE WHEN meta_level IN ('primary','junior_high','senior_high','college_vocational','other') THEN meta_level ELSE NULL END,
    NULLIF(LEFT(COALESCE(NEW.raw_user_meta_data ->> 'grade_level', ''), 80), ''),
    CASE WHEN meta_year ~ '^(20[2-9][0-9]|2100)$' THEN meta_year::integer ELSE NULL END,
    COALESCE(
      meta_path IN ('school_learner','wassce_candidate','independent_learner')
      AND meta_level IN ('primary','junior_high','senior_high','college_vocational','other'),
      false
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;