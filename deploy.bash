git pull origin master
yarn && yarn build
pm2 reload all
rm -rf /data/nginx/cache/alcor
