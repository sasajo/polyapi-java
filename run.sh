#!/bin/bash

cd demo-app

#mvn clean install -X
mvn clean compile polyapi:deploy-functions -X