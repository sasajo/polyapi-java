#!/bin/bash
# run this on server
set -e
cd $HOME/poly-alpha/
git pull
yarn install

# regenerate the hooks for the npm client
# TODO switch to prisma db migrate?
prisma db push

# regenerate the hooks for the python client
cd science
pip install -r requirements.txt
prisma generate
cd ..

yarn run build
# sudo systemctl restart api.service
# api.service will be `PORT=80 yarn run start:prod`
# sudo systemctl restart ds-server.service
# echo 'Waiting for BE...'
# sleep 1
# sudo systemctl status api.service --no-pager