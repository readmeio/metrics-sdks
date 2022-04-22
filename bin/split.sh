#!/usr/bin/env bash
set -e
set -x

function remote() {
    git remote add $1 $2 || true
}

function split() {
    # Set up the correct SSH key for each repo
    # Without this it will just use the first
    # key it finds which will likely not be correct
    if [ -n "$GITHUB_ACTIONS" ]
    then
        export GIT_SSH_COMMAND="ssh -i /home/runner/.ssh/$2 -o IdentitiesOnly=yes"
    fi
    git subtree push --prefix $1 $2 main
}

# Inspired by https://maxschmitt.me/posts/github-actions-ssh-key/
# This is so we can run this as part of a github action and push
# code out to the mirrors
function addSshKey() {
    # This only runs in a github action, since your local
    # ssh key will already have push access to the mirrors
    if [ -n "$GITHUB_ACTIONS" ]
    then
        mkdir -p /home/runner/.ssh
        ssh-keyscan github.com >> /home/runner/.ssh/known_hosts
        printenv $2 > /home/runner/.ssh/$1
        chmod 600 /home/runner/.ssh/$1
        ssh-agent -a $SSH_AUTH_SOCK > /dev/null || true
        ssh-add /home/runner/.ssh/$1
    fi
}

addSshKey sdks-node METRICS_SDK_NODE_PRIVATE_KEY
addSshKey sdks-php METRICS_SDK_PHP_PRIVATE_KEY
addSshKey sdks-python METRICS_SDK_PYTHON_PRIVATE_KEY
addSshKey sdks-ruby METRICS_SDK_RUBY_PRIVATE_KEY
addSshKey sdks-dotnet METRICS_SDK_DOTNET_PRIVATE_KEY

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
