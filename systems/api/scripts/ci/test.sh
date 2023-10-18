#!/bin/sh

set -ex

npx eslint .
npx tsc
npm run test:ci