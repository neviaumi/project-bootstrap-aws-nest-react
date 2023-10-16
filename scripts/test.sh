#! /usr/bin/env bash

set -e

CURRENT_BRANCH=$(git branch --show-current)
NVM_SOURCE="$NVM_DIR/nvm.sh"
echo "Current branch is $CURRENT_BRANCH"
docker compose up -d
npx lerna exec --stream \
--scope 'infrastructure' \
-- "test ! -f  scripts/dev-setup.sh || bash \
                                scripts/dev-setup.sh"
npx lerna exec --stream \
--scope 'infrastructure' \
-- "test ! -f  scripts/dev-deploy.sh || bash \
                                scripts/dev-deploy.sh"
npx lerna exec --stream \
--scope 'api' --scope 'web' \
-- "test ! -f  scripts/ci/test.sh || bash \
                                scripts/ci/test.sh"