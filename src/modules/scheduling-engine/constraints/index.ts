import type { CandidateContext, ConstraintRuleConfig } from "../types"
import { HARD_CONSTRAINTS_BY_KEY } from "./hard"
import { SOFT_CONSTRAINTS_BY_KEY } from "./soft"

export { HARD_CONSTRAINTS, HARD_CONSTRAINTS_BY_KEY } from "./hard"
export { SOFT_CONSTRAINTS, SOFT_CONSTRAINTS_BY_KEY } from "./soft"

export interface RuleLookup {
  isEnabled(key: string): boolean
  weight(key: string, fallback: number): number
  params(key: string): Record<string, unknown> | null
}

/** Index ConstraintRule rows for O(1) lookup; unknown keys default to enabled. */
export function buildRuleLookup(rules: ConstraintRuleConfig[]): RuleLookup {
  const byKey = new Map(rules.map((r) => [r.key, r]))
  return {
    isEnabled: (key) => byKey.get(key)?.enabled ?? true,
    weight: (key, fallback) => byKey.get(key)?.weight ?? fallback,
    params: (key) => byKey.get(key)?.params ?? null,
  }
}

/**
 * Run every enabled hard constraint. Returns the list of failed constraint keys
 * (empty = candidate is eligible).
 */
export function evaluateHard(ctx: CandidateContext, rules: RuleLookup): string[] {
  const failed: string[] = []
  for (const [key, constraint] of HARD_CONSTRAINTS_BY_KEY) {
    if (!rules.isEnabled(key)) continue
    const res = constraint.evaluate({ ...ctx, params: rules.params(key) })
    if (!res.ok) failed.push(res.reason ?? key)
  }
  return failed
}

export { SOFT_CONSTRAINTS_BY_KEY as softByKey, HARD_CONSTRAINTS_BY_KEY as hardByKey }
