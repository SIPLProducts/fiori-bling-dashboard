create or replace function public.net_sales_summary()
returns table (total numeric, sales_type text, type_total numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(d.amount), 0)::numeric as total,
    coalesce(nullif(trim(d.sales_type), ''), 'Other') as sales_type,
    coalesce(sum(d.amount), 0)::numeric as type_total
  from public.zfisales_detail d
  group by 2;
$$;

grant execute on function public.net_sales_summary() to authenticated;