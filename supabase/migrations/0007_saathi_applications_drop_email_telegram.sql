-- Dropped email and Telegram from the /saathi/apply contact step — phone
-- and WhatsApp are enough to reach applicants.
alter table saathi_applications
  drop column if exists email,
  drop column if exists telegram_username;
