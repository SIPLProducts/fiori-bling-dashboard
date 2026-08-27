create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sap_credentials (
  cred_key text primary key,
  secret bytea not null,
  updated_at timestamptz not null default now()
);

alter table public.sap_credentials enable row level security;
revoke all on public.sap_credentials from anon, authenticated;
grant all on public.sap_credentials to service_role;

create table if not exists public.app_crypto_keys (
  name text primary key,
  key_value text not null
);
alter table public.app_crypto_keys enable row level security;
revoke all on public.app_crypto_keys from anon, authenticated;
grant all on public.app_crypto_keys to service_role;

insert into public.app_crypto_keys(name, key_value)
values ('sap_credentials', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.set_sap_credential(_cred_key text, _secret text)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  k text;
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Forbidden: Sharvi Admin role required';
  end if;
  if _cred_key is null or length(trim(_cred_key)) = 0 then
    raise exception 'Credential key is required';
  end if;

  if _secret is null or length(_secret) = 0 then
    delete from public.sap_credentials where cred_key = _cred_key;
    return;
  end if;

  select key_value into k from public.app_crypto_keys where name = 'sap_credentials';

  insert into public.sap_credentials(cred_key, secret, updated_at)
  values (_cred_key, extensions.pgp_sym_encrypt(_secret, k), now())
  on conflict (cred_key) do update
    set secret = excluded.secret, updated_at = now();
end;
$$;

create or replace function public.list_sap_credential_keys()
returns setof text
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Forbidden: Sharvi Admin role required';
  end if;
  return query select cred_key from public.sap_credentials;
end;
$$;

create or replace function public.get_sap_credential(_cred_key text)
returns text
language plpgsql
stable
security definer
set search_path to 'public', 'extensions'
as $$
declare
  k text;
  raw bytea;
begin
  select key_value into k from public.app_crypto_keys where name = 'sap_credentials';
  select secret into raw from public.sap_credentials where cred_key = _cred_key;
  if raw is null then
    return null;
  end if;
  return extensions.pgp_sym_decrypt(raw, k);
end;
$$;

revoke all on function public.set_sap_credential(text, text) from public;
revoke all on function public.list_sap_credential_keys() from public;
revoke all on function public.get_sap_credential(text) from public;
grant execute on function public.set_sap_credential(text, text) to authenticated;
grant execute on function public.list_sap_credential_keys() to authenticated;
grant execute on function public.get_sap_credential(text) to service_role;