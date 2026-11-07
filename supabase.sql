-- 花花補給站 Supabase schema. Run once in SQL Editor.
-- IMPORTANT: Replace the four emails at the bottom and create the corresponding
-- Auth users in the Supabase dashboard before enabling shared use.

create table if not exists public.allowed_members (
  email text primary key
);

create or replace function public.is_flower_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_members
    where lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;
revoke all on function public.is_flower_member() from public;
grant execute on function public.is_flower_member() to authenticated;

create table if not exists public.players (
  id int primary key check(id between 0 and 3),
  name text not null check(length(trim(name)) between 1 and 28)
);
insert into public.players (id,name) values
  (0,'玩家1'),(1,'玩家2'),(2,'玩家3'),(3,'玩家4')
on conflict (id) do nothing;

create table if not exists public.inventory (
  player_id int not null references public.players(id) on delete restrict,
  flower text not null check(length(trim(flower)) between 1 and 80),
  petals int null check(petals between 0 and 9999999),
  nectar int null check(nectar between 0 and 9999999),
  updated_at timestamptz not null default now(),
  primary key(player_id,flower)
);
create table if not exists public.inventory_history (
  id bigint generated always as identity primary key,
  player_id int not null,
  flower text not null,
  old_petals int,
  old_nectar int,
  new_petals int,
  new_nectar int,
  changed_at timestamptz not null default now(),
  changed_by uuid
);

create or replace function public.inventory_audit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.inventory_history(player_id,flower,old_petals,old_nectar,new_petals,new_nectar,changed_by)
  values(new.player_id,new.flower,case when tg_op='UPDATE' then old.petals else null end,
    case when tg_op='UPDATE' then old.nectar else null end,new.petals,new.nectar,auth.uid());
  return new;
end;
$$;
drop trigger if exists on_inventory_change on public.inventory;
create trigger on_inventory_change after insert or update on public.inventory
for each row execute function public.inventory_audit();

alter table public.allowed_members enable row level security;
alter table public.players enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_history enable row level security;
-- No allowed_members policies: only SQL Editor / privileged admin can edit the membership list.

drop policy if exists players_read on public.players;
create policy players_read on public.players for select to authenticated using (public.is_flower_member());
drop policy if exists players_insert on public.players;
create policy players_insert on public.players for insert to authenticated with check (public.is_flower_member());
drop policy if exists players_update on public.players;
create policy players_update on public.players for update to authenticated
using (public.is_flower_member()) with check (public.is_flower_member());

drop policy if exists inventory_read on public.inventory;
create policy inventory_read on public.inventory for select to authenticated using (public.is_flower_member());
drop policy if exists inventory_insert on public.inventory;
create policy inventory_insert on public.inventory for insert to authenticated with check (public.is_flower_member());
drop policy if exists inventory_update on public.inventory;
create policy inventory_update on public.inventory for update to authenticated
using (public.is_flower_member()) with check (public.is_flower_member());

drop policy if exists history_read on public.inventory_history;
create policy history_read on public.inventory_history for select to authenticated using (public.is_flower_member());
-- History entries can only be inserted by the database trigger; no client insert/update/delete grants or policies.

grant select,insert,update on public.players to authenticated;
grant select,insert,update on public.inventory to authenticated;
grant select on public.inventory_history to authenticated;
revoke all on public.allowed_members from anon,authenticated;
revoke all on public.inventory_history from anon;

-- CHANGE THESE FOUR EMAILS to the actual email addresses of your members.
-- Then run the adjusted statement in the SQL Editor:
-- insert into public.allowed_members(email) values
-- ('person1@example.com'),
-- ('person2@example.com'),
-- ('person3@example.com'),
-- ('person4@example.com')
-- on conflict(email) do nothing;
