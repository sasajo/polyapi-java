#!/bin/bash
set -e
yarn install
yarn prisma migrate dev
cd science
prisma generate --generator py --schema ../prisma/schema.prisma
cd ..
