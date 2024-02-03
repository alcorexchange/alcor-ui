git pull origin master
yarn && yarn build && yarn build-server
pm2 reload all --update-env
pm2 restart Alcor-ibc-usdt-wax-worker
find /data/nginx/cache/alcor -type f -delete
