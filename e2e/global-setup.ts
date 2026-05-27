import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

async function globalSetup() {
    console.log("\n[setup] 重置数据库...")
    execSync("npx tsx prisma/prepare-db.ts", { cwd: root, stdio: "inherit" })
    execSync("npx prisma db push --force-reset --skip-generate", {
        cwd: root,
        stdio: "inherit",
    })
    execSync("npx prisma db seed", { cwd: root, stdio: "inherit" })
    console.log("[setup] 数据库重置完成\n")
}

export default globalSetup
