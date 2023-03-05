#!/bin/bash
# run this on server
set -e
cd $HOME/poly-alpha/
git pull
sudo pip3 install -r "train/requirements.txt"
yarn install
prisma db push
yarn run build
# TODO npm install
# sudo systemctl restart api.service
# api.service will be `PORT=80 yarn run start:prod`
# sudo systemctl restart ds-server.service
# echo 'Waiting for BE...'
# sleep 1
# sudo systemctl status api.service --no-pager