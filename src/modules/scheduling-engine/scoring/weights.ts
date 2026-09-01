/** Default soft-constraint weights. Overridden per-deployment by ConstraintRule rows. */
export const DEFAULT_WEIGHTS: Record<string, number> = {
  "workload-balance": 3,
  "anti-repetition": 2,
  "distance-before-release": 2,
  "shift-preference": 1,
  "qualification-preference": 1.5,
}
