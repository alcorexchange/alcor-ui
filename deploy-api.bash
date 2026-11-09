#!/bin/bash
# Fail fast: any failed step (pull, build, docker build) stops the deploy
# instead of restarting services on stale or broken artifacts.
set -euo pipefail
cd "$(dirname "$0")"

echo "Pulling latest changes from Git..."
git pull --ff-only origin master

echo "Installing dependencies and building API server..."
yarn install
yarn build-server

# Build both API images first. --network=host: the default Docker bridge network
# on prod has no outbound access, so `yarn install` inside the build fails (EAI_AGAIN).
# With set -e a failed build aborts here, before any running container is touched.
echo "Building Docker images..."
docker build --network=host -f Dockerfile.apiV2.bots -t alcor-api-bots:v2 .
docker build --network=host -f Dockerfile.apiV2.humans -t alcor-api-humans:v2 .

restart_api() {
  local kind="$1"
  echo "Restarting Docker container alcor-api-v2-${kind}..."
  docker stop "alcor-api-v2-${kind}" || true
  docker rm "alcor-api-v2-${kind}" || true
  docker run -d --name "alcor-api-v2-${kind}" --network=host --restart always \
    -v /opt/alcor-tools:/opt/alcor-tools:ro \
    -v /var/log/nginx:/var/log/nginx:ro \
    "alcor-api-${kind}:v2"
}
restart_api bots
restart_api humans

# Route Cache Updater decommissioned — routes are now served by the Rust route-finder.
docker stop alcor-routecache 2>/dev/null || true
docker rm alcor-routecache 2>/dev/null || true

echo "Clearing NGINX cache..."
find /data/nginx/cache/alcor -type f -delete

echo "Cleaning up old Docker images and build cache..."
docker image prune -af --filter "until=24h" || true
docker builder prune -af --filter "until=24h" || true

echo "Restarting PM2 services..."
pm2 reload all --update-env

echo "API deployment complete!"
