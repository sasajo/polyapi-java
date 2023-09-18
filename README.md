# Poly API

## Installation

```bash
$ yarn install
```

## Setup the .env file

```bash
# just copy over the template for local development
$ cp .env.template .env
```

## Migrate the DB, Generate Prisma Libraries

```bash
$ ./after_pull.sh
```

## Run Dev Start Script

```bash
$ ./dev_start.sh
```

This script will start:

* Redis
* Postgres
* Vault
* Node Server on 8000
* Flask Server on 5000