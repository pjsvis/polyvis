#!/bin/bash
# Setup review branch with sparse checkout

set -e

REVIEW_BRANCH="review-under-100mb"
MAIN_BRANCH="alpine-refactor"

# Create sparse-checkout pattern file
cat > .sparse-checkout-patterns << 'EOF'
# Include code and docs
/*
!/.resonance/cache/
!/local_cache/
!/node_modules/
!/public/resonance.db
!/public/resonance.db-*
!*.onnx
!*.pt
!*.pth
!*.bin
!*.gguf
!*.safetensors
EOF

# Create the review branch
if ! git show-ref --verify --quiet refs/heads/$REVIEW_BRANCH; then
    git checkout -b $REVIEW_BRANCH $MAIN_BRANCH
    ./scripts/cleanup-review-branch.sh
    git add .
    git commit -m "Initial review branch - optimized for size"
    
    echo "Review branch created successfully!"
    echo "Use './scripts/update-review-branch.sh' to update from main branch"
else
    echo "Review branch already exists. Use './scripts/update-review-branch.sh' to update."
fi

echo "Current branch size: $(git ls-files | xargs du -ch | grep total)"
