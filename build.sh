#!/bin/bash
set -e
set -v
ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$ROOT"

docker build -t nirhub/web .
