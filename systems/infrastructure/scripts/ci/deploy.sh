#!/bin/bash

set -ex
STACK=$1
set +e
PULUMI_CONFIG_PASSPHRASE= pulumi stack init organization/project-bootstrap/$STACK
set -e
PULUMI_CONFIG_PASSPHRASE= pulumi stack select organization/project-bootstrap/$STACK
PULUMI_CONFIG_PASSPHRASE= pulumi up --yes
