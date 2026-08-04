create index pin_login_audit_user_id_idx on private.pin_login_audit(user_id);
create index metrics_equipment_id_idx on public.equipment_monthly_metrics(equipment_id);
create index metrics_report_import_id_idx on public.equipment_monthly_metrics(report_import_id);
create index import_audit_actor_id_idx on public.import_audit_log(actor_id);
create index import_audit_report_id_idx on public.import_audit_log(report_import_id);
create index report_imports_imported_by_idx on public.report_imports(imported_by);
create index report_imports_replaced_id_idx on public.report_imports(replaced_import_id);
create index user_client_access_client_id_idx on public.user_client_access(client_id);
create index user_client_access_granted_by_idx on public.user_client_access(granted_by);

drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles for update to authenticated
  using (((select auth.jwt())->'app_metadata'->>'role')='admin')
  with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
