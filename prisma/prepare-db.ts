import { closeSync, existsSync, mkdirSync, openSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const databasePath = resolve(__dirname, "dev.db")

mkdirSync(dirname(databasePath), { recursive: true })

if (!existsSync(databasePath)) {
    closeSync(openSync(databasePath, "w"))
}
