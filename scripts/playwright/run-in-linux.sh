#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
COMMAND=${1:-npm run test:e2e:local}

proot-distro login debian -- sh -lc "cd '$REPO_DIR' && $COMMAND"
