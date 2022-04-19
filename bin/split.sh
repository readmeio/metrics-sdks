#!/usr/bin/env bash
set -e
set -x

CURRENT_BRANCH="main"

function split() {
    # https://github.com/splitsh/lite
    SHA1=`./bin/splitsh-lite --prefix=$1`
    git push $2 "$SHA1:refs/heads/$CURRENT_BRANCH" -f
}

function remote() {
    git remote add $1 $2 || true
}

git pull origin $CURRENT_BRANCH

remote sdks-node git@github.com:readmeio/metrics-sdks-node.git
remote sdks-php git@github.com:readmeio/metrics-sdks-php.git
remote sdks-python git@github.com:readmeio/metrics-sdks-python.git
remote sdks-ruby git@github.com:readmeio/metrics-sdks-ruby.git

split 'packages/node' sdks-node
split 'packages/php' sdks-php
split 'packages/python' sdks-python
split 'packages/ruby' sdks-ruby
