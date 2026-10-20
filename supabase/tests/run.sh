#!/usr/bin/env bash
# Test RLS (recette T11) sur une base Postgres JETABLE: le schéma public y est recréé.
# Usage: DATABASE_URL=postgres://user@host:port/db supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
PGOPTIONS='-c client_min_messages=warning' psql "$DATABASE_URL" -q -c 'drop schema if exists public cascade; drop schema if exists auth cascade; create schema public;'
PGOPTIONS='-c client_min_messages=warning' psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f auth_stub.sql -f ../migrations/0001_init.sql
out=$(psql "$DATABASE_URL" -f rls_test.sql 2>&1)
grep -q "RLS: tous les contrôles passent" <<<"$out" || { echo "$out"; exit 1; }
echo "RLS OK"
