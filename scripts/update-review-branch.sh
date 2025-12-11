#!/bin/bash
# Update review branch from main branch

set -e

REVIEW_BRANCH="review-under-100mb"
MAIN_BRANCH="alpine-refactor"

# Switch to review branch or create it
if git show-ref --verify --quiet refs/heads/$REVIEW_BRANCH; then
    git checkout $REVIEW_BRANCH
else
    git checkout -b $REVIEW_BRANCH $MAIN_BRANCH
    ./scripts/cleanup-review-branch.sh
    git add .
    git commit -m "Initial review branch - cleaned large files"
fi

# Merge changes from main branch
git merge --no-commit $MAIN_BRANCH || true

# Clean up any large files that might have been merged
./scripts/cleanup-review-branch.sh

# Commit the merge
git add .
git commit -m "Merge from $MAIN_BRANCH - cleaned for review"

echo "Review branch updated successfully!"
echo "Branch size: $(git ls-files | xargs du -ch | grep total)"

# Push the review branch to origin
git push origin review-under-100mb
