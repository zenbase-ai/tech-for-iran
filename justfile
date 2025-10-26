# Justfile – handy task runner (https://just.systems)

# --- settings ---------------------- https://just.systems/man/en/settings.html
set dotenv-load := true
set dotenv-path := ".env"
set ignore-comments := true

[group('ai')]
claude *args:
  bunx @anthropic-ai/claude-code@latest {{args}}

[group('ai')]
gemini *args:
  bunx @google/gemini-cli@latest {{args}}

dev *args:
  bun --bun next dev {{args}}

build:
  bun --bun next build

analyze:
  ANALYZE=1 bun --bun next build --webpack

preview: build
  bun --bun next start

fmt:
  biome check --write && \
  biome format --write

lint:
  biome check
