import { createClient } from '@supabase/supabase-js'

// Same Supabase project already used by every other Kalanis workbook
// (workbook-organisation, workbook-positionnement-voix) — every submission
// lands in the same `client_workbooks` table, tagged by `workbook_type`
// ('refonte_1500' for this one). No new table or SQL needed: the table and
// its RLS policies (anon insert only, authenticated select) already exist.
const supabaseUrl = 'https://qglyfohuebgbuztjqaok.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbHlmb2h1ZWJnYnV6dGpxYW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTgxODQsImV4cCI6MjA5MTgzNDE4NH0.HKqxiTKQDV8zvfpTmE8RlDq_GsbwHATzfn1gyDkJLxQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
