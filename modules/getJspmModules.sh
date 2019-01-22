#!/bin/bash
reset
set -e

BASE_URL=git@github.com:jspm/
REPOS=(
   nodelibs-child_process,0.1.0
   nodelibs-crypto,0.1.0
   nodelibs-dgram,0.1.0
   nodelibs-dns,0.1.0
   nodelibs-events,0.1.1
   nodelibs-fs,0.1.1
   nodelibs-http,1.7.1
   nodelibs-https,0.1.0
   nodelibs-module,0.1.0
   nodelibs-net,0.1.2
   nodelibs-os,0.1.0
   nodelibs-path,0.1.0
   nodelibs-process,0.1.2
   nodelibs-querystring,0.1.0
   nodelibs-readline,0.1.0
   nodelibs-stream,0.1.0
   nodelibs-string_decoder,0.1.0
   nodelibs-timers,0.1.0
   nodelibs-tls,0.1.0
   nodelibs-tty,0.1.0
   nodelibs-url,0.1.0
   nodelibs-util,0.1.0
   nodelibs-vm,0.1.0
   nodelibs-zlib,0.1.0
)

for i in ${REPOS[@]}; do
    REPO=${i%,*};
    VERSION=${i#*,};
    echo $BASE_URL$REPO
    git clone $BASE_URL$REPO
    cd $REPO
    git checkout $VERSION
    rm -rf .git
    cd ..
done

