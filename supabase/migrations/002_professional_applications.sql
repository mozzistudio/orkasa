create table professional_applications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  specialty text not null,
  whatsapp text not null,
  zones text[] not null,
  years_experience int,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table professional_applications enable row level security;

create policy "Allow public insert"
  on professional_applications
  for insert
  with check (true);
