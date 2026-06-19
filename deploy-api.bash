#!/bin/bash

# Update code from Git
echo "Pulling latest changes from Git..."
git pull origin master

# Install dependencies and build server only
echo "Installing dependencies and building API server..."
yarn install && yarn build-server

# Clear NGINX cache
echo "Clearing NGINX cache..."
find /data/nginx/cache/alcor -type f -delete

# Restart bots container
echo "Building Docker container for bots..."
docker build -f Dockerfile.apiV2.bots -t alcor-api-bots:v2 .

echo "Restarting Docker container for bots..."
docker stop alcor-api-v2-bots || true
docker rm alcor-api-v2-bots || true
docker run -d --name alcor-api-v2-bots --network=host --restart always \
  -v /opt/alcor-tools:/opt/alcor-tools:ro \
  -v /var/log/nginx:/var/log/nginx:ro \
  alcor-api-bots:v2

# Restart humans container
echo "Building Docker container for humans..."
docker build -f Dockerfile.apiV2.humans -t alcor-api-humans:v2 .

echo "Restarting Docker container for humans..."
docker stop alcor-api-v2-humans || true
docker rm alcor-api-v2-humans || true
docker run -d --name alcor-api-v2-humans --network=host --restart always \
  -v /opt/alcor-tools:/opt/alcor-tools:ro \
  -v /var/log/nginx:/var/log/nginx:ro \
  alcor-api-humans:v2

# Route Cache Updater decommissioned — routes are now served by the Rust route-finder.
# Tear down the old container if it's still running (these lines can be removed after one deploy).
echo "Removing decommissioned Route Cache Updater container..."
docker stop alcor-routecache || true
docker rm alcor-routecache || true

echo "Cleaning up old Docker images..."
docker image prune -af --filter "until=24h"

# Clear build cache
echo "Cleaning up Docker build cache..."
docker builder prune -af --filter "until=24h"

# Restart PM2 services
echo "Restarting PM2 services..."
pm2 reload all --update-env
#pm2 restart Alcor-ibc-usdt-wax-worker

echo "API deployment complete!"
