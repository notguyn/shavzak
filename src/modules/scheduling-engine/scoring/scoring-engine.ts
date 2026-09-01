import { SOFT_CONSTRAINTS, type RuleLookup } from "../constraints"
import type { CandidateContext, SoftBreakdown } from "../types"
import { DEFAULT_WEIGHTS } from "./weights"

export interface ScoredCandidate {
  totalScore: number
  breakdown: SoftBreakdown[]
}

/**
 * Weighted sum of enabled soft constraints, normalised to 0..1 by total weight.
 * Returns the per-constraint breakdown so the explainer can show *why*.
 */
export function scoreCandidate(ctx: CandidateContext, rules: RuleLookup): ScoredCandidate {
  let weighted = 0
  let totalWeight = 0
  const breakdown: SoftBreakdown[] = []

  for (const constraint of SOFT_CONSTRAINTS) {
    if (!rules.isEnabled(constraint.key)) continue
    const weight = rules.weight(constraint.key, DEFAULT_WEIGHTS[constraint.key] ?? 1)
    const { score } = constraint.score({ ...ctx, params: rules.params(constraint.key) })
    const contribution = score * weight
    weighted += contribution
    totalWeight += weight
    breakdown.push({ key: constraint.key, weight, score, contribution })
  }

  const totalScore = totalWeight > 0 ? weighted / totalWeight : 0
  breakdown.sort((a, b) => b.contribution - a.contribution)
  return { totalScore, breakdown }
}
