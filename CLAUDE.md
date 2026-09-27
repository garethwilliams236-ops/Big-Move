# Big Move — notes for Claude

- Owner: Gareth (sole developer). Users: Gareth and Kristin, one shared household — all data is shared.
- Access control: RLS on every table via `public.is_member()` (JWT email must be in `public.members`). No per-user data.
- Schema lives in `supabase/schema.sql`; keep `supabase/setup.sql` = schema.sql + seed.sql in sync. New tables need RLS + touch trigger (see loops at the end of schema.sql).
- Client pages use `lib/useTable.ts` + `components/EditDialog.tsx` (field-driven forms). Overview is a server component.
- Ask Claude: `app/api/ask/route.ts`, env `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL` (default `claude-sonnet-5`). Tries web search tool, falls back without.
- Dev port 3080. Run `npm run typecheck` and `npm run build` before committing.
- Gareth prefers one short instruction at a time.
