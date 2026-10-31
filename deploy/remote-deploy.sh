#!/usr/bin/env bash
# Runs ON the VPS: started detached by .github/workflows/deploy.yml, or by hand through ./deploy.sh.
# Usage: remote-deploy.sh <branch>   (DEPLOY_DIR overrides the project path, default ~/aydexCloud)
set -euo pipefail
BRANCH="${1:?branch required}"
[[ "$BRANCH" =~ ^[A-Za-z0-9._/-]+$ ]] || { echo "bad branch name"; exit 1; }

cd "${DEPLOY_DIR:-$HOME/aydexCloud}"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git merge --ff-only "origin/$BRANCH" || { echo "server checkout has local changes or diverged:"; git status --short; exit 1; }
git log --oneline -1

docker compose build --pull web tracker
docker compose up -d web tracker
docker compose up -d --force-recreate cron   # picks up ops/crontab changes
docker compose exec -T web npx prisma db push
docker image prune -f >/dev/null

for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3001/health && curl -fsS -o /dev/null http://127.0.0.1:3000/; then
    echo "healthy"; exit 0
  fi
  sleep 3
done
echo "services did not become healthy"; docker compose ps; exit 1
