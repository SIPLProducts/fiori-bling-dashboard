INSERT INTO public.tile_groups (key, title, sort_order) VALUES
  ('sales-distribution', 'Sales & Distribution', 20),
  ('financial-accounting', 'Financial Accounting', 21),
  ('controlling', 'Controlling', 22),
  ('production-planning', 'Production Planning', 23),
  ('quality-management', 'Quality Management', 24),
  ('project-systems', 'Project Systems', 25)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, sort_order) VALUES
  ('sales-distribution', 'SD — Sales & Distribution', 'Order intake, billing and delivery performance', 'grid', 'launch', NULL, '/reports/module/sd', 0),
  ('sales-distribution', 'Net Sales', 'Rolling 12 months', 'currency', 'kpi', 'sd_net_sales', '/reports/module/sd', 1),
  ('sales-distribution', 'Open Sales Orders', 'Not yet delivered', 'cart', 'kpi', 'sd_open_orders', '/reports/module/sd', 2),
  ('sales-distribution', 'Backorders', 'Past requested date', 'alert', 'kpi', 'sd_backorders', '/reports/module/sd', 3),
  ('sales-distribution', 'Sales Trend', 'Monthly net sales', 'trend', 'chart', 'sd_sales_trend', '/reports/module/sd', 4),

  ('financial-accounting', 'FI — Financial Accounting', 'Receivables, payables, cash and closing status', 'grid', 'launch', NULL, '/reports/module/fi', 0),
  ('financial-accounting', 'Open Receivables', 'All company codes', 'currency', 'kpi', 'fi_receivables', '/reports/module/fi', 1),
  ('financial-accounting', 'Open Payables', 'Due within 30 days', 'doc', 'kpi', 'fi_payables', '/reports/module/fi', 2),
  ('financial-accounting', 'Days Sales Outstanding', 'Rolling average', 'clock', 'kpi', 'fi_dso', '/reports/module/fi', 3),
  ('financial-accounting', 'Cash Flow Trend', 'Monthly net cash', 'trend', 'chart', 'fi_cash_trend', '/reports/module/fi', 4),

  ('controlling', 'CO — Controlling', 'Cost centres, plan/actual variance, internal orders', 'grid', 'launch', NULL, '/reports/module/co', 0),
  ('controlling', 'Actual Cost', 'Year to date', 'currency', 'kpi', 'co_actual_cost', '/reports/module/co', 1),
  ('controlling', 'Budget Variance', 'Plan vs actual', 'alert', 'kpi', 'co_budget_variance', '/reports/module/co', 2),
  ('controlling', 'Open Internal Orders', 'Awaiting settlement', 'list', 'kpi', 'co_internal_orders', '/reports/module/co', 3),
  ('controlling', 'Cost Trend', 'Monthly actual cost', 'trend', 'chart', 'co_cost_trend', '/reports/module/co', 4),

  ('production-planning', 'PP — Production Planning', 'Production orders, capacity load and adherence', 'grid', 'launch', NULL, '/reports/module/pp', 0),
  ('production-planning', 'Open Production Orders', 'Released and in progress', 'list', 'kpi', 'pp_open_orders', '/reports/module/pp', 1),
  ('production-planning', 'Schedule Adherence', 'Last 30 days', 'check', 'kpi', 'pp_schedule_adherence', '/reports/module/pp', 2),
  ('production-planning', 'Capacity Utilisation', 'All work centres', 'pie', 'kpi', 'pp_capacity_load', '/reports/module/pp', 3),
  ('production-planning', 'Output Trend', 'Monthly confirmed output', 'trend', 'chart', 'pp_output_trend', '/reports/module/pp', 4),

  ('quality-management', 'QM — Quality Management', 'Inspection lots, defects and supplier quality', 'grid', 'launch', NULL, '/reports/module/qm', 0),
  ('quality-management', 'Open Inspection Lots', 'Awaiting usage decision', 'doc', 'kpi', 'qm_open_lots', '/reports/module/qm', 1),
  ('quality-management', 'Defect Rate', 'Parts per million', 'alert', 'kpi', 'qm_defect_rate', '/reports/module/qm', 2),
  ('quality-management', 'Open Notifications', 'Quality issues', 'star', 'kpi', 'qm_notifications', '/reports/module/qm', 3),
  ('quality-management', 'Quality Trend', 'Monthly defect rate', 'trend', 'chart', 'qm_quality_trend', '/reports/module/qm', 4),

  ('project-systems', 'PS — Project Systems', 'Budgets, milestones, WBS spend and delivery risk', 'grid', 'launch', NULL, '/reports/module/ps', 0),
  ('project-systems', 'Active Projects', 'Released and running', 'grid', 'kpi', 'ps_active_projects', '/reports/module/ps', 1),
  ('project-systems', 'Budget Consumed', 'Across all projects', 'pie', 'kpi', 'ps_budget_consumed', '/reports/module/ps', 2),
  ('project-systems', 'Milestones At Risk', 'Next 60 days', 'alert', 'kpi', 'ps_milestones_at_risk', '/reports/module/ps', 3),
  ('project-systems', 'Project Spend Trend', 'Monthly committed spend', 'trend', 'chart', 'ps_spend_trend', '/reports/module/ps', 4);