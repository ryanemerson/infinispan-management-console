#!/bin/bash
set -e

ROOT=$PWD
LIB=$ROOT/modules
JSPM_REG=$ROOT/jspm-registry
CACHE_DIR=~/.jspm/packages/github/jspm/
mkdir -p $CACHE_DIR
cp -R $LIB/* $CACHE_DIR

cd $JSPM_REG
rm -rf .git
git init
git add .
git commit -m "Commit Registry"

cd $ROOT
jspm config registries.jspm.repo $ROOT/jspm-registry/.git
jspm install

