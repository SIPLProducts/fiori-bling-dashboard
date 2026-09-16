REVOKE EXECUTE ON FUNCTION public.activate_zfisales_snapshot(text, uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_zfisales_snapshot(text, uuid, integer) TO service_role;