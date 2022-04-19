#!/usr/bin/env bash
set -e
set -x

CURRENT_BRANCH="main"

function split() {
    git subtree push --prefix $1 $2 main
}

function remote() {
    git remote add $1 $2 || true
}

git pull origin $CURRENT_BRANCH

remote sdks-node git@github.com:readmeio/metrics-sdks-node.git
remote sdks-php git@github.com:readmeio/metrics-sdks-php.git
remote sdks-python git@github.com:readmeio/metrics-sdks-python.git
remote sdks-ruby git@github.com:readmeio/metrics-sdks-ruby.git
remote sdks-dotnet git@github.com:readmeio/metrics-sdks-dotnet.git

split 'packages/node' sdks-node
split 'packages/php' sdks-php
split 'packages/python' sdks-python
split 'packages/ruby' sdks-ruby
split 'packages/dotnet' sdks-dotnet
