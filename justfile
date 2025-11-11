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

dev:
  bun --bun convex dev & \
  bun --bun next dev & \
  wait

build:
  bun --bun next build

preview: build
  bun --bun next start

fmt:
  bun --bun biome check --write && \
  bun --bun biome format --write

lint:
  bun --bun biome check
