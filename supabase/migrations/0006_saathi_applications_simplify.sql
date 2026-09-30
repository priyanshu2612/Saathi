-- Simplified the /saathi/apply form: dropped the display-name, background,
-- experience, qualifications, boundaries and bio fields in favour of a
-- single "profession" field and a shorter, seeker-facing topics list.
-- Added an optional Telegram handle alongside the other contact fields.
alter table saathi_applications
  drop column if exists display_name,
  drop column if exists background,
  drop column if exists background_other,
  drop column if exists experience_range,
  drop column if exists qualifications,
  drop column if exists topics_other,
  drop column if exists topics_avoid,
  drop column if exists bio,
  add column if not exists profession text not null default '',
  add column if not exists telegram_username text;

alter table saathi_applications alter column profession drop default;
