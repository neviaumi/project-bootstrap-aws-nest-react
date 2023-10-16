#!/usr/bin/env bash

rm -rf node_modules
rm -rf package-lock.json
npm install
rm -rf ./systems/**/node_modules
rm -rf ./systems/**/package-lock.json
npx lerna exec --concurrency 1 --stream -- "test ! -f  scripts/dev-setup.sh || bash \
scripts/dev-setup.sh"
