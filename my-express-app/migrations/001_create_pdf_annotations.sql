create table if not exists public.pdf_annotations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.app_users(id) on delete cascade,
    note_id uuid not null references public.notes(id) on delete cascade,
    page_number integer not null check (page_number > 0),
    annotation_type text not null default 'highlight'
        check (annotation_type in ('highlight', 'underline', 'strikeout')),
    color text not null default '#f7d154',
    selected_text text not null,
    comment text not null default '',
    rects jsonb not null check (jsonb_typeof(rects) = 'array'),
    created_at timestamp without time zone not null default now(),
    updated_at timestamp without time zone not null default now()
);

create index if not exists pdf_annotations_note_user_page_idx
    on public.pdf_annotations (note_id, user_id, page_number);
