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

- Redis
- Postgres
- Vault
- Node Server on 8000
- Flask Server on 5000

## Get your API Key

If this is the first time you are running the server, you probably need your api key! To get it, do this:

```bash
source .env && psql $DATABASE_URL -c 'select key from api_key;'
```

## Test the API Key

To test the API key, copy the api key from the step above and use it to hit the whoami endpoint:

```bash
curl -H "Authorization: Bearer <API_KEY>" localhost:8000/whoami
```

## How to Run Knative Locally

WARNING: these steps are experimental and incomplete

1. Follow the [Knative quickstart](https://knative.dev/docs/getting-started/quickstart-install/) steps to get `kind`, `kubectl`, and `kn` running locally

2. Continue to follow the Knative quickstart steps to run the Knative Quickstart Plugin.

IMPORANT: be sure to pass the --registry flag so kind also creates a Docker registry.

3. Add a `poly-functions` persistant volume CLAIM. Follow [this guide](https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/#create-a-persistentvolume) but instead of naming the volume `task-pv-volume` name it `poly-functions` in the YAML file.

4. Configure your knative to allow `persistant-volume-claims`. Add these two to the ConfigMap:
* kubernetes.podspec-persistent-volume-claim: "enabled"
* kubernetes.podspec-persistent-volume-write: "enabled"
The easiest way is to dump the old configmap to a file:

```
kubectl get configmap -n knative-serving config-features > config-features.yaml
```

Then edit it and use `kubectl apply -f config-features.yaml` to update the config map.

5. More steps required TBD!
6. Go in to `./dev_start.sh` and comment out the `SKIP_KNATIVE=1` option.
7. That's it! Run the following command to start your server

`KUBE_CONFIG_USE_DEFAULT=true FAAS_DOCKER_USERNAME=tbd FAAS_DOCKER_PASSWORD=tbd ./dev_start.sh`.

NOTE: following the above steps will let you create a server function. However, the actual docker container doesn't seem to be really created... or something. When you try to execute you get a 404. TODO: figure out how why `this.customObjectsApi.createNamespacedCustomObject` doesn't seem to be actually creating the pod.