-- Comfort Companion — server-side billing/wallet functions.
-- These are SECURITY DEFINER so they can be called from Edge Functions
-- (via the service role) to mutate wallets/coin_transactions, which have
-- no client-facing insert/update policies by design (see 0001_init.sql).

create or replace function apply_session_tick(
  p_session_id uuid, p_seeker_id uuid, p_mentor_id uuid,
  p_coins int, p_mentor_share_pct int
) returns void as $$
begin
  insert into coin_transactions (user_id, amount, type, related_session_id)
  values (p_seeker_id, -p_coins, 'session_spend', p_session_id);

  update wallets set coin_balance = coin_balance - p_coins, updated_at = now()
  where user_id = p_seeker_id;

  insert into coin_transactions (user_id, amount, type, related_session_id)
  values (p_mentor_id, floor(p_coins * p_mentor_share_pct / 100.0), 'session_earning', p_session_id);

  update wallets set coin_balance = coin_balance + floor(p_coins * p_mentor_share_pct / 100.0), updated_at = now()
  where user_id = p_mentor_id;

  update sessions set total_coins_charged = total_coins_charged + p_coins
  where id = p_session_id;
end;
$$ language plpgsql security definer;

create or replace function increment_wallet_balance(p_user_id uuid, p_amount int)
returns void as $$
begin
  insert into wallets (user_id, coin_balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set coin_balance = wallets.coin_balance + p_amount, updated_at = now();
end;
$$ language plpgsql security definer;
