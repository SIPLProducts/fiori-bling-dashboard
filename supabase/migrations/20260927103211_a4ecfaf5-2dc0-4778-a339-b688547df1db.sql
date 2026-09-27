DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ztbn'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ztbn;
  END IF;
END
$migration$;