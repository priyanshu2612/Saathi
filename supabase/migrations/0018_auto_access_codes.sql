-- Every Saathi application automatically gets a single-use access code
-- (mentor_invites row pinned to the applicant's phone). The code is stored on
-- the application row so the admin can read it next to the applicant's
-- details and pass it on by phone. It is never shown to the applicant.

alter table saathi_applications add column if not exists access_code text;

create or replace function make_access_code() returns text
language plpgsql
as $$
declare
  code text;
begin
  loop
    code := 'SA-' || lpad(floor(random() * 1000000)::int::text, 6, '0');
    exit when not exists (select 1 from mentor_invites where access_code = code);
  end loop;
  return code;
end;
$$;

create or replace function saathi_application_access_code() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.access_code := make_access_code();
  insert into mentor_invites (access_code, phone, prefill_name, prefill_languages)
  values (new.access_code, new.phone, split_part(new.full_name, ' ', 1), new.languages);
  return new;
end;
$$;

drop trigger if exists saathi_application_access_code_trg on saathi_applications;
create trigger saathi_application_access_code_trg
  before insert on saathi_applications
  for each row execute function saathi_application_access_code();

-- One-time backfill: give every existing application a code and mark it
-- shortlisted (all current applications have been reviewed and approved).
do $$
declare
  app record;
  code text;
begin
  for app in select id, phone, full_name, languages from saathi_applications where access_code is null loop
    code := make_access_code();
    insert into mentor_invites (access_code, phone, prefill_name, prefill_languages)
    values (code, app.phone, split_part(app.full_name, ' ', 1), app.languages);
    update saathi_applications set access_code = code, status = 'shortlisted' where id = app.id;
  end loop;
end;
$$;
