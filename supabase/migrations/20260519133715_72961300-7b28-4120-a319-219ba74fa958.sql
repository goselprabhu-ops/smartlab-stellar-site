
drop policy if exists "Anyone can submit contact form" on public.contact_submissions;
create policy "Public can submit contact form"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (
    length(trim(name))    between 1 and 100
    and length(trim(email)) between 3 and 255
    and email like '%@%.%'
    and length(trim(message)) between 1 and 1000
  );
