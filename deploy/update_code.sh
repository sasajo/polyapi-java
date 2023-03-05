#!/bin/bash
# run this on server
set -e
cd $HOME/poly-alpha/
git pull
sudo pip3 install -r "train/requirements.txt"
# TODO npm install
# prisma db push
# sudo systemctl restart api.service
# sudo systemctl restart ds-server.service
# echo 'Waiting for BE...'
# sleep 1
# sudo systemctl status api.service --no-pager