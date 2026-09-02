
insert into public.app_crypto_keys(name, key_value)
values ('sap_cron_url', 'https://project--27aeaa58-eb6a-4965-897d-c1097d9ba383.lovable.app/api/public/sap/pull/zfisales')
on conflict (name) do update set key_value = excluded.key_value;

insert into public.app_crypto_keys(name, key_value)
values ('sap_cron_token', 'ZXNrkzs22EXuoAmJ6s0fGZPJOSsqOY')
on conflict (name) do update set key_value = excluded.key_value;

create or replace function public.apply_sap_sync_schedule(_endpoint text, _enabled boolean, _cron text)
returns text
language plpgsql
security definer
set search_path to 'public', 'cron', 'net', 'extensions'
as $function$
declare
  job_name text;
  url text;
  token text;
  cmd text;
  norm text;
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Forbidden: Sharvi Admin role required';
  end if;
  if _endpoint is null or length(trim(_endpoint)) = 0 then
    raise exception 'Endpoint name is required';
  end if;

  job_name := 'sap-sync-' || lower(regexp_replace(_endpoint, '[^a-zA-Z0-9]+', '-', 'g'));

  perform cron.unschedule(jobid) from cron.job where jobname = job_name;

  if not _enabled then
    return 'disabled';
  end if;

  norm := trim(regexp_replace(coalesce(_cron, ''), '\s+', ' ', 'g'));
  if norm !~ '^\S+ \S+ \S+ \S+ \S+$' then
    raise exception 'Invalid cron expression: % (expected 5 fields, e.g. */5 * * * *)', _cron;
  end if;

  select key_value into url from public.app_crypto_keys where name = 'sap_cron_url';
  select key_value into token from public.app_crypto_keys where name = 'sap_cron_token';
  if url is null or token is null then
    raise exception 'Scheduler URL/token is not configured';
  end if;

  cmd := format(
    $q$select net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb) as request_id;$q$,
    url,
    json_build_object('Content-Type', 'application/json', 'x-sync-token', token)::text,
    json_build_object('endpoint', _endpoint)::text
  );

  perform cron.schedule(job_name, norm, cmd);
  return norm;
end;
$function$;

revoke all on function public.apply_sap_sync_schedule(text, boolean, text) from public;
grant execute on function public.apply_sap_sync_schedule(text, boolean, text) to authenticated;
