git pull origin master
yarn && yarn build && yarn server-build
pm2 reload all
find /data/nginx/cache/alcor -type f -delete
