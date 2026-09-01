import { createEntityStore } from "./store"
import type { SoldierRow } from "@/components/soldiers/soldiers-table"
import type { BoardRow } from "@/components/boards/boards-table"
import type { RuleRow } from "@/components/constraints/constraints-editor"
import type { AssignmentRow } from "@/components/assignments/assignments-table"

export const previewSoldiersStore = createEntityStore<SoldierRow>()
export const previewBoardsStore = createEntityStore<BoardRow>()
export const previewConstraintRulesStore = createEntityStore<RuleRow>()
export const previewAssignmentsStore = createEntityStore<AssignmentRow>()
