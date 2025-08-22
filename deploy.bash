#!/bin/bash

# Обновить код с Git
echo "Pulling latest changes from Git..."
git pull origin master

# Установить зависимости и собрать проект
echo "Installing dependencies and building the project..."
yarn install && yarn build && yarn build-server

# Удалить кэш
echo "Clearing NGINX cache..."
find /data/nginx/cache/alcor -type f -delete

# Перезапускать контейнер
echo "Building Docker container..."
docker build -f Dockerfile.apiV2 -t alcor-api:v2 .

echo "Restarting Docker container..."
docker stop alcor-api-v2 || true
docker rm alcor-api-v2 || true
docker run -d --name alcor-api-v2 --network=host --restart always alcor-api:v2

# Обновить Route Cache Updater
echo "Building Route Cache Updater Docker container..."
docker build -f Dockerfile.routecache-simple -t alcor-routecache:latest .

echo "Restarting Route Cache Updater container..."
docker stop alcor-routecache || true
docker rm alcor-routecache || true
docker run -d --name alcor-routecache --network=host --restart always alcor-routecache:latest

# Перезапускать другие службы PM2
echo "Restarting PM2 services..."
pm2 reload all --update-env
#pm2 restart Alcor-ibc-usdt-wax-worker

echo "Deployment complete!"
