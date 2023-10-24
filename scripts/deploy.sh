#!/usr/bin/env bash

set -ex
ENVIRONMENT=$1

# Disable the commit hook
export HUSKY=0
SCRIPT_LOCATION=$(dirname $(pwd)/${BASH_SOURCE[0]})
WORK_SPACE_ROOT=$(realpath "$SCRIPT_LOCATION"/../)
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" == "main" ]; then
  echo "With major version"
  VERSION=$(date +'%Y.%-m.%-d')
else
  echo "With alpha version"
  VERSION=$(date +"%Y.%-m.%-d-alpha.$(($(date +"%-H") + 1))%M")
fi
export RELEASE_BRANCH="release-$VERSION"
COMMIT_MESSAGE="release v$VERSION [skip ci]"
git switch -c "$RELEASE_BRANCH"
git push --set-upstream origin "$RELEASE_BRANCH"
npx lerna version --message "$COMMIT_MESSAGE" --yes $VERSION
git push --tags
npx lerna exec --stream \
--scope 'infrastructure' \
-- "bash scripts/ci/deploy.sh $ENVIRONMENT"

npx lerna exec --stream \
--scope 'infrastructure' \
-- "bash scripts/ci/export-environment.sh $ENVIRONMENT"

source $WORK_SPACE_ROOT/.env

npx lerna exec --stream \
--scope 'api' \
-- "bash scripts/ci/deploy.sh"

npx lerna exec --stream \
--scope 'web' \
-- "bash scripts/ci/deploy.sh"