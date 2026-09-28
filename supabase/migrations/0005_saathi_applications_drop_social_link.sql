-- Instagram/LinkedIn was dropped from the /saathi/apply form — it wasn't
-- used for anything and just added friction.
alter table saathi_applications drop column if exists social_link;
