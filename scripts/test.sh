#! /usr/bin/env bash

set -e

CURRENT_BRANCH=$(git branch --show-current)
NVM_SOURCE="$NVM_DIR/nvm.sh"
echo "Current branch is $CURRENT_BRANCH"
# TODO: setup again
echo "All Good!"