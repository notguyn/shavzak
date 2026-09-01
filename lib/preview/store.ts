"use client"

import { useSyncExternalStore } from "react"

import { PREVIEW_MODE } from "./flag"

/**
 * A per-domain, module-level singleton store used only in preview mode.
 * "Seed once, mutate locally": the first render passes the server-fetched
 * snapshot in, after that all reads/writes go through this store — which
 * means it survives client-side navigation between pages (edits stay visible
 * as you browse) but resets on a hard reload (the module re-evaluates fresh),
 * matching "the site resets when it (re)opens".
 */
export function createEntityStore<T extends { id: string }>() {
  let items: T[] | null = null
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())

  return {
    seed(initial: T[]) {
      if (items === null) {
        items = initial
        notify()
      }
    },
    getSnapshot: () => items,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    create(item: T) {
      items = [...(items ?? []), item]
      notify()
    },
    update(id: string, patch: Partial<T>) {
      items = (items ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i))
      notify()
    },
    remove(id: string) {
      items = (items ?? []).filter((i) => i.id !== id)
      notify()
    },
  }
}

export type EntityStore<T extends { id: string }> = ReturnType<typeof createEntityStore<T>>

/**
 * Reads from the singleton store in preview mode (seeding it once from
 * `initial`); reads straight from `initial` otherwise, so nothing changes
 * for the default (non-preview) path.
 */
export function useEntityStore<T extends { id: string }>(store: EntityStore<T>, initial: T[]): T[] {
  if (PREVIEW_MODE) store.seed(initial)
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, () => null)
  return PREVIEW_MODE ? (snapshot ?? initial) : initial
}
