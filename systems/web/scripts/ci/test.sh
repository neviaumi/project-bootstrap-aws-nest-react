#!/bin/sh

set -ex

npx eslint .
npx tsc
npx cypress run --component -b chrome