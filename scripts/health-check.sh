#!/bin/bash
# Rube Clone — Health Check & Phase Monitor
# Runs every 5 minutes to verify platform status

LOG_FILE="/root/rube-clone/logs/health.log"
PLAN_FILE="/root/rube-clone/PLAN.md"
mkdir -p /root/rube-clone/logs

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "" >> "$LOG_FILE"
echo "=== $TIMESTAMP ===" >> "$LOG_FILE"

# 1. Check if server is running
SERVER=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sign-in 2>/dev/null)
if [ "$SERVER" = "200" ]; then
  echo "✅ Server: UP" >> "$LOG_FILE"
else
  echo "❌ Server: DOWN (attempting restart...)" >> "$LOG_FILE"
  fuser -k 3000/tcp 2>/dev/null
  sleep 2
  cd /root/rube-clone && export DATABASE_URL="postgresql://neondb_owner:npg_C8NQymkaMR9O@ep-hidden-forest-abvpbf77-pooler.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require" && PORT=3000 npx next dev --port 3000 &
  echo "🔄 Server: Restarting..." >> "$LOG_FILE"
fi

# 2. Check API endpoints
for ep in api/sessions api/chat api/workflows; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/$ep 2>/dev/null)
  if [ "$CODE" = "200" ] || [ "$CODE" = "401" ]; then
    echo "✅ /$ep: $CODE" >> "$LOG_FILE"
  else
    echo "❌ /$ep: $CODE" >> "$LOG_FILE"
  fi
done

# 3. Check database
DB_CHECK=$(cd /root/rube-clone && export DATABASE_URL="postgresql://neondb_owner:npg_C8NQymkaMR9O@ep-hidden-forest-abvpbf77-pooler.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require" && node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$queryRaw\`SELECT 1\`.then(() => console.log('ok')).catch(() => console.log('fail')).finally(() => p.\$disconnect())" 2>&1)
if echo "$DB_CHECK" | grep -q "ok"; then
  echo "✅ Database: Connected" >> "$LOG_FILE"
else
  echo "❌ Database: Connection failed" >> "$LOG_FILE"
fi

# 4. Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
  echo "✅ Disk: ${DISK_USAGE}% used" >> "$LOG_FILE"
else
  echo "⚠️ Disk: ${DISK_USAGE}% used - running low!" >> "$LOG_FILE"
fi

# 5. Check memory
MEM_USED=$(free -m | awk 'NR==2{printf "%.0f", $3/$2*100}')
echo "📊 Memory: ${MEM_USED}% used" >> "$LOG_FILE"

# 6. Count DB records (data persistence check)
cd /root/rube-clone && export DATABASE_URL="postgresql://neondb_owner:npg_C8NQymkaMR9O@ep-hidden-forest-abvpbf77-pooler.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
USERS=$(npx prisma db execute --stdin <<< "SELECT count(*) FROM \"User\";" 2>&1 | grep -oE '[0-9]+' | head -1)
SESSIONS=$(npx prisma db execute --stdin <<< "SELECT count(*) FROM \"ChatSession\";" 2>&1 | grep -oE '[0-9]+' | head -1)
WORKFLOWS=$(npx prisma db execute --stdin <<< "SELECT count(*) FROM \"Workflow\";" 2>&1 | grep -oE '[0-9]+' | head -1)
echo "📊 DB Stats: Users=$USERS Sessions=$SESSIONS Workflows=$WORKFLOWS" >> "$LOG_FILE"

echo "✅ Health check complete" >> "$LOG_FILE"
