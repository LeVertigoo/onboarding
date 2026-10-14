-- Migration "Espace client" — Kalanis Workbook
-- À coller une seule fois dans Supabase (SQL Editor du projet qglyfohuebgbuztjqaok),
-- puis "Run". Entièrement additif :
--   - aucune ligne existante de client_workbooks n'est modifiée en contenu
--     (les colonnes ajoutées prennent une valeur par défaut neutre)
--   - aucune policy RLS existante n'est touchée (insert anon / select authentifié
--     restent identiques) — les nouvelles fonctions ci-dessous passent par
--     SECURITY DEFINER pour lire/écrire de façon contrôlée, sans ouvrir la table
--     en lecture publique.
-- Peut être rejoué sans risque (IF NOT EXISTS / CREATE OR REPLACE partout).

-- 1. Colonnes additionnelles -------------------------------------------------
alter table public.client_workbooks
  add column if not exists client_email text,
  add column if not exists status text not null default 'completed',
  add column if not exists updated_at timestamptz not null default now();

-- Toutes les lignes déjà en base sont des soumissions finales : le défaut
-- 'completed' ci-dessus les décrit correctement sans qu'on ait besoin de les
-- toucher une par une.

-- 2. Petit helper de normalisation d'email -----------------------------------
create or replace function public._norm_email(e text)
returns text
language sql
immutable
as $$ select lower(trim(coalesce(e, ''))) $$;

-- 3. Lecture de l'espace d'un client (tous volets, brouillons + terminés) ----
-- Callable par le rôle anon (le client, avant toute connexion admin), mais ne
-- renvoie QUE les lignes dont l'email normalisé correspond exactement à celui
-- fourni — ce n'est pas une ouverture de la table en lecture publique.
create or replace function public.get_espace(p_email text)
returns table (
  id uuid,
  workbook_type text,
  status text,
  answers jsonb,
  client_name text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, workbook_type, status, answers, client_name, created_at, updated_at
  from client_workbooks
  where public._norm_email(client_email) = public._norm_email(p_email)
    and public._norm_email(p_email) <> ''
  order by updated_at desc
$$;

grant execute on function public.get_espace(text) to anon;

-- 4. Sauvegarde de brouillon (upsert ciblé sur email + type de volet) -------
create or replace function public.save_draft(
  p_email text,
  p_client_name text,
  p_workbook_type text,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from client_workbooks
  where public._norm_email(client_email) = public._norm_email(p_email)
    and workbook_type = p_workbook_type
    and status = 'draft'
  limit 1;

  if v_id is null then
    insert into client_workbooks (client_name, client_email, workbook_type, answers, status, updated_at)
    values (p_client_name, public._norm_email(p_email), p_workbook_type, p_answers, 'draft', now())
    returning id into v_id;
  else
    update client_workbooks
    set answers = p_answers,
        client_name = coalesce(p_client_name, client_name),
        updated_at = now()
    where id = v_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.save_draft(text, text, text, jsonb) to anon;

-- 5. Finalisation d'un volet (passe le brouillon en 'completed', ou insère
--    directement une ligne terminée s'il n'y avait pas de brouillon) --------
create or replace function public.complete_workbook(
  p_email text,
  p_client_name text,
  p_workbook_type text,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from client_workbooks
  where public._norm_email(client_email) = public._norm_email(p_email)
    and workbook_type = p_workbook_type
    and status = 'draft'
  limit 1;

  if v_id is null then
    insert into client_workbooks (client_name, client_email, workbook_type, answers, status, updated_at)
    values (p_client_name, public._norm_email(p_email), p_workbook_type, p_answers, 'completed', now())
    returning id into v_id;
  else
    update client_workbooks
    set answers = p_answers,
        client_name = coalesce(p_client_name, client_name),
        status = 'completed',
        updated_at = now()
    where id = v_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.complete_workbook(text, text, text, jsonb) to anon;
