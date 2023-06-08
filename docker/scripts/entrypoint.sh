#!/bin/bash
yarn prisma migrate deploy
yarn run build
nohup yarn run start:prod &
cd science
nohup flask --app app run --host 0.0.0.0 --debug