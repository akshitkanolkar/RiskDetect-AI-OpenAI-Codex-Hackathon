-- Table privileges required in addition to RLS policies
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on public.url_scans to authenticated;
grant select, insert, update on public.image_scans to authenticated;
grant select, insert, update on public.chat_sessions to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select, insert on public.risk_history to authenticated;

grant all on public.url_scans to service_role;
grant all on public.image_scans to service_role;
grant all on public.chat_sessions to service_role;
grant all on public.chat_messages to service_role;
grant all on public.risk_history to service_role;
