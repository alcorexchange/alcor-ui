git pull origin master
yarn && yarn build
pm2 reload all
find /data/nginx/cache/alcor -type f -delete
