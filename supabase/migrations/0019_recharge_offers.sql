-- One-time "recharge within 5 minutes, get 50 extra coins" offer per seeker.
-- started_at is set the first time the offer is shown (seeker_offer function);
-- the offer is valid for 5 minutes from then. redeemed_at is stamped by the
-- Cashfree webhook when the bonus is credited, so it can only be won once.
-- Service-role only; no client policies.
create table if not exists recharge_offers (
  user_id uuid primary key references profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  redeemed_at timestamptz
);

alter table recharge_offers enable row level security;
