# Deploy

There are two deploy scripts at present.

## First Time Server Setup

To setup a server for the first time, run `provision_server.sh`!

```
cd poly-alpha
./deploy/provision_server.sh
```

This command should only need to be run once per server! (Or when the systemd config files change.)

## Deploy New Code

Most of the time, you'll just want to deploy new code. To do that, run `update_code.sh`

```
cd poly-alpha
./deploy/update_code.sh
```

This script will:

* pull down the new code
* update all dependencies (both yarn and pip)
* restart Node API and Python API and all other services