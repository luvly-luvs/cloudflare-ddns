#!/bin/bash

echo "Starting DDNS"
cd /ddns/app
yarn install --production
yarn start