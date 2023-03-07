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

## Loading the DB

```bash
$ prisma db push
$ cd science
$ prisma generate
$ ./load_fixtures.py
```

## Running the app

This will run the Python server on port 5000:

```bash
$ cd science
$ ./server.py
```

This will run the Node server on port 8000:

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Endpoints

`POST /teach` - prepares Poly API function

`POST /teach/:functionId` - updated Poly API function with response and/or metadata
