#!/bin/bash
reset
set -e

for D in */; do cd $D && jspm link -y && cd ..; done

