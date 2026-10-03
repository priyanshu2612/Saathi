-- Gifts seekers send Saathis during a call, plus the first-recharge bonus
-- transaction type. Like the rest of the ledger, written only by server-side
-- functions (service role).

alter table coin_transactions drop constraint if exists coin_transactions_type_check;
alter table coin_transactions add constraint coin_transactions_type_check
  check (type in (
    'purchase', 'bonus', 'session_spend', 'session_earning', 'refund',
    'free_credit', 'gift_sent', 'gift_received'
  ));

alter table coin_transactions add column if not exists description text;

create table if not exists gifts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions (id) on delete cascade,
  seeker_id uuid not null references profiles (id) on delete cascade,
  mentor_id uuid not null references profiles (id) on delete cascade,
  gift_id text not null,
  gift_name text not null,
  coins int not null check (coins > 0),
  mentor_coins int not null check (mentor_coins >= 0),
  created_at timestamptz not null default now()
);

create index if not exists gifts_session_idx on gifts (session_id, created_at);

alter table gifts enable row level security;

create policy "gifts: read own" on gifts
  for select using (auth.uid() = seeker_id or auth.uid() = mentor_id);

-- Atomically moves coins from the seeker to the Saathi and records the gift.
-- Returns the seeker's new balance, or -1 if they can't afford it.
create or replace function apply_gift(
  p_session_id uuid, p_seeker_id uuid, p_mentor_id uuid,
  p_gift_id text, p_gift_name text, p_coins int, p_mentor_coins int
) returns int as $$
declare
  new_balance int;
begin
  update wallets
     set coin_balance = coin_balance - p_coins, updated_at = now()
   where user_id = p_seeker_id and coin_balance >= p_coins
  returning coin_balance into new_balance;

  if new_balance is null then
    return -1;
  end if;

  insert into coin_transactions (user_id, amount, type, related_session_id, description)
  values (p_seeker_id, -p_coins, 'gift_sent', p_session_id, p_gift_name);

  insert into coin_transactions (user_id, amount, type, related_session_id, description)
  values (p_mentor_id, p_mentor_coins, 'gift_received', p_session_id, p_gift_name);

  update wallets set coin_balance = coin_balance + p_mentor_coins, updated_at = now()
   where user_id = p_mentor_id;

  insert into gifts (session_id, seeker_id, mentor_id, gift_id, gift_name, coins, mentor_coins)
  values (p_session_id, p_seeker_id, p_mentor_id, p_gift_id, p_gift_name, p_coins, p_mentor_coins);

  return new_balance;
end;
$$ language plpgsql security definer;
