#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  SELECT 'CREATE DATABASE payment_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_db')\gexec
  SELECT 'CREATE DATABASE order_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_db')\gexec
EOSQL
