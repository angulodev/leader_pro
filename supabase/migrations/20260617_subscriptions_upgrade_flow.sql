-- Esquema agnóstico de proveedor de pago para el flujo de upgrade de planes.
-- user_plans sigue siendo la fuente de verdad de "qué plan está activo ahora".
-- subscriptions registra el ciclo de vida de cada intento/cobro de suscripción.

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'cancelled')),
  provider text,                          -- 'mercadopago' | 'stripe' | null mientras no se decide
  provider_subscription_id text,          -- id externo una vez creado el checkout/preapproval
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);

alter table public.subscriptions enable row level security;

create policy "user_sees_own_subscriptions"
  on public.subscriptions
  for all
  using (user_id = auth.uid());

-- Solicita iniciar un upgrade: crea una suscripción pendiente.
-- No activa el plan todavía -- eso lo hará la función que procese el webhook
-- del proveedor de pago, una vez que se integre.
create or replace function public.al_request_upgrade(p_plan_id text)
returns json
language plpgsql
security definer
as $function$
declare
  v_sub_id uuid;
  v_plan json;
begin
  select json_build_object('id', p.id, 'name', p.name, 'price_clp', p.price_clp, 'max_projects', p.max_projects)
    into v_plan
  from public.plans p
  where p.id = p_plan_id and p.is_active = true;

  if v_plan is null then
    raise exception 'invalid_plan';
  end if;

  insert into public.subscriptions (user_id, plan_id, status)
  values (auth.uid(), p_plan_id, 'pending')
  returning id into v_sub_id;

  return json_build_object(
    'subscription_id', v_sub_id,
    'plan', v_plan,
    'status', 'pending'
  );
end;
$function$;

grant execute on function public.al_request_upgrade to authenticated;
grant select, insert on public.subscriptions to authenticated;
