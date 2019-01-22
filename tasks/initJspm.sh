#!/bin/bash
set -e

ROOT=$PWD
LIB=$ROOT/modules
CACHE_DIR=~/.jspm/packages/github/jspm/
mkdir -p $CACHE_DIR
cp -R $LIB/* $CACHE_DIR
jspm install

