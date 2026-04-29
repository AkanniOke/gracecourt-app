alter table public.push_tokens
add column if not exists email text;

create index if not exists push_tokens_email_idx
on public.push_tokens (email);
