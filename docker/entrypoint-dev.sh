#!/bin/sh
set -e

echo "🚀 Starting Taskosaur Development Environment..."

# Function to wait for PostgreSQL
wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL to be ready..."

  # Extract database host and port from DATABASE_URL (format: postgresql://user:pass@host:port/db)
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  TARGET_HOST="${DB_HOST:-postgres}"
  TARGET_PORT="${DB_PORT:-5432}"

  max_attempts=30
  attempt=0

  until nc -z "$TARGET_HOST" "$TARGET_PORT" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ PostgreSQL did not become ready in time ($TARGET_HOST:$TARGET_PORT)"
      exit 1
    fi
    echo "   Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
    sleep 2
  done
  echo "✅ PostgreSQL is ready at $TARGET_HOST:$TARGET_PORT!"
}

# Function to wait for Redis
wait_for_redis() {
  echo "⏳ Waiting for Redis to be ready..."

  TARGET_HOST="${REDIS_HOST:-redis}"
  TARGET_PORT="${REDIS_PORT:-6379}"

  max_attempts=30
  attempt=0

  until nc -z "$TARGET_HOST" "$TARGET_PORT" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ Redis did not become ready in time ($TARGET_HOST:$TARGET_PORT)"
      exit 1
    fi
    echo "   Waiting for Redis... (attempt $attempt/$max_attempts)"
    sleep 2
  done
  echo "✅ Redis is ready at $TARGET_HOST:$TARGET_PORT!"
}

echo ""
echo "🔧 Bootstrapping Application..."

# Wait for dependencies
wait_for_postgres
wait_for_redis

# Generate Prisma Client
echo ""
echo "🔨 Generating Prisma Client..."
npm run db:generate || true

# Run database migrations
echo ""
echo "🗃️  Running database migrations..."
npm run db:migrate:deploy || npm run db:migrate || {
  echo "⚠️  Migration finished or already up to date"
}

echo ""
echo "✅ Bootstrap completed! (DatabaseSeederRunner will initialize sample data automatically on Spring Boot start if database is empty)"
echo ""
echo "🎯 Starting development servers (frontend + backend)..."
exec npm run dev
