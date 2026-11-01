ALTER FUNCTION public.try_uuid(text) SET search_path = '';
REVOKE ALL ON FUNCTION public.extract_class_quiz_keys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.extract_class_quiz_keys() TO authenticated, service_role;