#!/usr/bin/env bash

set -ex

npx lerna exec --stream \
--scope 'backend' --scope 'web' \
-- "test ! -f  scripts/dev-setup.sh || bash \
                                scripts/dev-setup.sh"
npx lerna exec --stream \
--scope 'backend' --scope 'web' \
-- "test ! -f  scripts/dev-server.sh || bash \
                                scripts/dev-server.sh"