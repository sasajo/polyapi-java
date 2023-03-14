#!/bin/bash
git pull
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs python3-pip vim libcap2-bin redis

# enable node to run on port 80
sudo setcap cap_net_bind_service=+ep /usr/bin/node

curl --compressed -o- -L https://yarnpkg.com/install.sh | bash
yarn install

sudo cp -v deploy/api.service /usr/lib/systemd/system/
sudo cp -v deploy/science.service /usr/lib/systemd/system/

sudo systemctl enable api.service
sudo systemctl enable science.service