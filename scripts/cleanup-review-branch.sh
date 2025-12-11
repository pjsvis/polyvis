#!/bin/bash
# Cleanup script for review branch - removes large files

echo "Cleaning up large files for review branch..."

# Remove cache directories
rm -rf .resonance/cache/
rm -rf local_cache/
rm -rf public/resonance.db public/resonance.db-*

# Remove large binary files (model files)
find . -name "*.onnx" -delete
find . -name "*.pt" -delete
find . -name "*.pth" -delete
find . -name "*.bin" -delete
find . -name "*.gguf" -delete
find . -name "*.safetensors" -delete

# Remove embedding model files
find . -name "tokenizer.json" -delete
find . -name "vocab.txt" -delete
find . -name "special_tokens_map.json" -delete
find . -name "config.json" -delete

# Keep .gitignore updated with exclusions
if ! grep -q "\.resonance/cache/" .gitignore; then
    echo ".resonance/cache/" >> .gitignore
fi

echo "Cleanup complete. Review branch ready for commit."
