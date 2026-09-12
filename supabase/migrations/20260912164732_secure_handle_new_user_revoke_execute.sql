-- Advisor 0028/0029: handle_new_user() is a SECURITY DEFINER trigger function.
-- It must NOT be callable via PostgREST RPC by anon/authenticated. The trigger
-- itself keeps working (it runs as table owner regardless of EXECUTE grants).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
