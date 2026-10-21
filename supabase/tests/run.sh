#!/usr/bin/env bash
# Tests SQL (isolation T11, facturation T10) sur une base Postgres JETABLE: les schémas y sont recréés.
# Usage: DATABASE_URL=postgres://user@host:port/db supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
# Chaque fichier de test repart d'une base fraîche et doit afficher sa notice de succès.
check() {
  PGOPTIONS='-c client_min_messages=warning' psql "$DATABASE_URL" -q -c 'drop schema if exists public cascade; drop schema if exists auth cascade; drop schema if exists storage cascade; create schema public;'
  PGOPTIONS='-c client_min_messages=warning' psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f auth_stub.sql $(printf -- '-f %s ' ../migrations/*.sql)
  out=$(psql "$DATABASE_URL" -f "$1" 2>&1 || true)
  grep -q "$2" <<<"$out" || { echo "$out"; echo "ÉCHEC: $1"; exit 1; }
  echo "OK: $1"
}
check rls_test.sql "RLS: tous les contrôles passent"
check billing_test.sql "Facturation: tous les contrôles passent"
check profiles_test.sql "Profils: tous les contrôles passent"
