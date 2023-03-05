#!/bin/bash
git pull
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs python3-pip vim # redis
npm install yarn
# maybe do this instead:
# curl --compressed -o- -L https://yarnpkg.com/install.sh | bash
yarn install
sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep /usr/bin/node
# TODO add OPENAI_API_KEY env variable
# also add other variables?