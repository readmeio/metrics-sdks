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

# Because https://packagist.org/ works off by repository syncing, not published tags, in order to
# publish the PHP SDK it cannot be contained within a monorepo so we need to split it off into a
# read-only mirror we've got. Packagist then monitors this mirror for any changes and publishes
# changes when we push code to it.
addSshKey sdks-php METRICS_SDK_PHP_PRIVATE_KEY
remote sdks-php git@github.com:readmeio/metrics-sdks-php.git
split 'packages/php' sdks-php
