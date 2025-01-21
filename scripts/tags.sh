#! /bin/bash

# These are for reference only

# get all the tags from the current branch
git tag -l

# create a new tag with a message
git tag -a v0.0.1 -m "This is a test tag"

# show info about a tag
git show v0.0.1

# push the tag to the remote repository
git push origin v0.0.1

# get the commit hash for a tag
git rev-list -n 1 v0.0.1

# delete a tag locally
git tag -d v0.0.1

# push the delete to the remote repository
git push origin --delete v0.0.1


