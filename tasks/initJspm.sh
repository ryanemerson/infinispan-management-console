#!/bin/bash
set -o xtrace

ROOT=$PWD
JSPM_LOADER_FILES=$ROOT/jspm-loader-files
JSPM_MODS=$ROOT/jspm-modules
JSPM_REG=$ROOT/jspm-registry
CACHE_DIR=~/.jspm/packages/github/jspm/
LOADER_DIR=~/.jspm/loader-files/

mkdir -p $CACHE_DIR
mkdir -p $LOADER_DIR
cp -R $JSPM_MODS/* $CACHE_DIR
cp -R $JSPM_LOADER_FILES/* $LOADER_DIR
ls -l $CACHE_DIR
ls -l $LOADER_DIR

cd $JSPM_REG
rm -rf .git
git init
git config user.email "ignore@infinispan.com"
git config user.name "build"
git add .
git commit -m "Commit Registry"

cd $ROOT
jspm config registries.jspm.repo $ROOT/jspm-registry/.git
jspm setmode local
jspm install

ls -l ~/.jspm/loader-files/systemjs

