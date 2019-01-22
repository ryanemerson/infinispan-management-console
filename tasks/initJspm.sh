#!/bin/bash
set -e

ROOT=$PWD
LIB=$ROOT/modules

jspm setmode local
cd $LIB
for module_name in *; do
  if [ -d "${module_name}" ]; then
    echo "Install $LIB/$module_name"
    cd $LIB/$module_name
    VERSION="$(grep -Po '"version":.*?[^\\]",' package.json | perl -pe 's/"version"://; s/^"//; s/",$//')"
    VERSION="${VERSION:2}"
    PACKAGE="github:jspm/$module_name@$VERSION"
    echo "jspm link -y $PACKAGE"
    jspm link -y $PACKAGE
    cd $ROOT
    echo "jspm install --link -y $PACKAGE"
    jspm install --link -y $PACKAGE
    cd $LIB
  fi
done

cd $ROOT
echo "DIFF"
git diff src/jspm.conf.js
git checkout -f src/jspm.conf.js
echo "Install Jspm"
jspm install

