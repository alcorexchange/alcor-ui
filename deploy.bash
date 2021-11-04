git checkout yarn.lock
git pull origin master
yarn && yarn build
pm2 reload all
