# polyvis justfile — the facade
# Public API surface for agents and humans. One-liner dispatch only.
# See playbooks/just-file-playbook.md for the boundary rule.

# discover
default:
    @just --list

about:
    @glow README.md

orient:
    @scripts/orient.sh

browse:
    @scripts/browse.sh

read file='':
    @if [ -z "{{file}}" ]; then \
        find docs playbooks -name '*.md' -not -path '*/archive/*' | fzf --preview 'glow {}' | xargs -I{} glow {}; \
    else \
        glow "{{file}}"; \
    fi

help:
    @glow SYSTEM.md

# hygiene
check:
    @bun run precommit

format:
    @bun run format

lint:
    @bun run lint

# build
build:
    @bun run build:css && bun run build:js

build-css:
    @bun run build:css

build-js:
    @bun run build:js

build-data:
    @bun run build:data

# services (dispatch to bun run scripts)
dev *args:
    @bun run dev {{args}}

servers:
    @bun run servers

inspect-db:
    @bun run inspect-db
