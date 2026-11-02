-- Cashfree can deliver the same webhook more than once; the payment id makes
-- crediting coins idempotent.
alter table coin_transactions add column if not exists cashfree_payment_id text;
create unique index if not exists coin_transactions_cashfree_payment_idx
  on coin_transactions (cashfree_payment_id) where cashfree_payment_id is not null;
