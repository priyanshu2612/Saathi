-- City & state is now optional on the first step of /saathi/apply.
alter table saathi_applications alter column city_state drop not null;
