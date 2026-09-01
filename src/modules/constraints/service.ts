import { prisma } from "@/lib/prisma"

export function listRules() {
  return prisma.constraintRule.findMany({ orderBy: [{ kind: "asc" }, { key: "asc" }] })
}
