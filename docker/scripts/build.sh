#!/bin/bash
set -e
source .env

pip3 install pyarmor==8.4.1

cd science
pyarmor gen -O app_o -r app
rm -rf app
mv app_o/* ./
rmdir app_o
cd ..

docker build --progress=plain \
  -t ghcr.io/polyapi/polyapi:latest \
  -f docker/Dockerfile \
  .