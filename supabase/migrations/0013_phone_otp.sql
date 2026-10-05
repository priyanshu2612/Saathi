-- SMS OTP verification of a phone number before a seeker account is created.
-- Written only by the `phone_otp` and `seeker_auth` edge functions (service role).

-- One live code per phone. Only a salted hash of the code is stored.
create table if not exists phone_otps (
  phone text primary key check (phone ~ '^[0-9]{10}$'),
  code_hash text not null,
  code_salt text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Every send, for rate limiting (per phone, per IP, and a global kill switch
-- so a bug or an attacker can't run up the SMS bill).
create table if not exists phone_otp_sends (
  id bigint generated always as identity primary key,
  phone text not null,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists phone_otp_sends_phone_idx on phone_otp_sends (phone, created_at desc);
create index if not exists phone_otp_sends_ip_idx on phone_otp_sends (ip, created_at desc);
create index if not exists phone_otp_sends_created_idx on phone_otp_sends (created_at desc);

alter table phone_otps enable row level security;
alter table phone_otp_sends enable row level security;
-- No client policies: service role only.
