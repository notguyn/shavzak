import { fileURLToPath } from "node:url"
import path from "node:path"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so a stray parent lockfile doesn't confuse Turbopack.
  turbopack: { root: projectRoot },
  output: "standalone",
}

export default withNextIntl(nextConfig)
