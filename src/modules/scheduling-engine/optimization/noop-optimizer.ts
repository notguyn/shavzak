import type { Optimizer, OptimizerInput } from "./optimizer.interface"

/**
 * Pass-through optimiser used in v1. Kept behind the Optimizer interface so a
 * real local-search/ILP optimiser can replace it without engine or UI changes.
 */
export const noopOptimizer: Optimizer = {
  name: "noop",
  optimize({ decisions }: OptimizerInput) {
    return decisions
  },
}
