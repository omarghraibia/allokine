create table if not exists public.appointments (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.users(id) on delete cascade,
    patient_name text,
    date date not null,
    time text not null,
    location text not null default 'cabinet',
    reason text not null,
    service_id text,
    service_price numeric(10, 3),
    total_price numeric(10, 3),
    pain_description text not null,
    specific_needs text default '',
    request_details jsonb not null default '{}'::jsonb,
    attached_file jsonb,
    status text not null default 'en_attente',
    notes jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists appointments_patient_id_idx on public.appointments(patient_id);
create index if not exists appointments_date_time_idx on public.appointments(date, time);
create index if not exists appointments_status_idx on public.appointments(status);
