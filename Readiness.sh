#!/bin/bash

response=$(curl --location https://develop-k8s.polyapi.io/health \
--header 'Authorization:Bearer ptab4f62d3421bca3674hfd627')

#expected_status='"status":"ok"'

status=$(echo "$response" | jq -r .status)

# echo $status

if [[ "$status" == "ok" ]]; then
   exit 0 # Success, pod is ready
else
   exit 1 # Failure, pod is not ready
fi
