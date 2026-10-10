ALTER TABLE public.open_sales_orders ADD COLUMN IF NOT EXISTS kwert_inr numeric NOT NULL DEFAULT 0;
ALTER TABLE public.open_sales_orders ADD COLUMN IF NOT EXISTS ld_status text;
COMMENT ON COLUMN public.open_sales_orders.kwert_inr IS 'SAP KWERT_INR original rupee amount; sole Open Value source, no NETWR fallback or quantity scaling.';
COMMENT ON COLUMN public.open_sales_orders.ld_status IS 'SAP LD_STATUS preserved as text, including N and Y; not a delivery-status reinterpretation.';
COMMENT ON COLUMN public.open_sales_orders.open_value IS 'Compatibility mirror of kwert_inr populated by the shared SAP mapper; new reports read kwert_inr.';
COMMENT ON COLUMN public.open_sales_orders.sales_org IS 'DEPRECATED: VKORG absent from the approved 124-key Open Orders SAP response; retained for older deployments.';