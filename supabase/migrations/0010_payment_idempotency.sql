-- Razorpay can deliver the same webhook more than once; the payment id makes
-- crediting coins idempotent.
alter table coin_transactions add column if not exists razorpay_payment_id text;
create unique index if not exists coin_transactions_razorpay_payment_idx
  on coin_transactions (razorpay_payment_id) where razorpay_payment_id is not null;
