#!/bin/sh

if [ "${POSTGRES_SSL}" = "true" ] || [ "${PGSSLMODE}" = "require" ]; then
  export PGSSLMODE=require
fi
DB_NAME=${POSTGRES_DATABASE:-postgres}
echo "Looking for the database ..."
echo "Checking database at ${POSTGRES_HOST}:${POSTGRES_PORT}, user ${POSTGRES_USER}, db ${DB_NAME}, sslmode ${PGSSLMODE:-disabled}"
while ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$DB_NAME"
do
  echo "Waiting for database."
  sleep 2
done
echo "Found database."
echo "Starting the application..."

pnpm run migration:run:prod
pnpm run start