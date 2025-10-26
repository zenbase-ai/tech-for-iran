import type { SpawnOptions } from "bun"

const spawnOptions: SpawnOptions.OptionsObject<SpawnOptions.Writable, SpawnOptions.Readable, SpawnOptions.Readable> = {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
}

Bun.spawn(["bun", "run", "dev"], spawnOptions)
Bun.spawn(["bun", "run", "tunnel"], spawnOptions)

process.on("SIGINT", async () => {})
