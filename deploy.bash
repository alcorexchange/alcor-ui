git pull origin master
yarn && yarn build && yarn build-server
pm2 reload all --update-env
find /data/nginx/cache/alcor -type f -delete
