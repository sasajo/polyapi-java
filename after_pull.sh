#!/bin/bash
set -e
yarn install
yarn prisma migrate dev
cd science
prisma generate
cd ..