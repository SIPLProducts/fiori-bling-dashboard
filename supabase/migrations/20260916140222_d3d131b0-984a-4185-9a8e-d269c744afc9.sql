DROP INDEX IF EXISTS public.zfisales_detail_record_key_idx;
CREATE UNIQUE INDEX zfisales_detail_record_key_idx ON public.zfisales_detail (record_key);
CREATE UNIQUE INDEX IF NOT EXISTS zfisales_detail_scope_snapshot_hash_occurrence_idx
  ON public.zfisales_detail (sync_scope_key, snapshot_id, row_hash, occurrence_no);