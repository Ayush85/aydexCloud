#!/usr/bin/env bash
# One-command deploy on the VPS:   ./deploy.sh            (deploys the branch you are on)
#                                  ./deploy.sh main       (or a named branch)
set -euo pipefail
cd "$(dirname "$0")"
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
echo "Deploying $BRANCH to $(pwd)"
DEPLOY_DIR="$(pwd)" bash deploy/remote-deploy.sh "$BRANCH"
docker compose ps
echo "Done. Hard-refresh the site (Ctrl+Shift+R)."
