#!/bin/sh

set -ex

curl -fsSL https://get.pulumi.com | sh
npm install
npm run build
STATE_STORE_BUCKET=$(node ./bin/setup-state-store.js infrastructure-as-code-state-store)
pulumi login "s3://$STATE_STORE_BUCKET"
