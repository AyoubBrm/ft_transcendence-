#!/bin/sh

waitfordb()
{
  until pg_isready -h localhost -p 5432 -q -U postgres
  do
    echo "Waiting for database..."
    sleep 1
  done
  echo "Database is ready!"
  PG_HBA_CONF="/var/lib/postgresql/data/pg_hba.conf"
  sed -i 's/127\.0\.0\.1/0.0.0.0/g' "$PG_HBA_CONF"
  pg_ctl -D "$PGDATA" -m fast -w restart
}

waitfordb &