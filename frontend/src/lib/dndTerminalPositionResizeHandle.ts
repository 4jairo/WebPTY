import { TerminalsCtx } from "../context/terminalsContext"
import { dropZoneInner } from "./dropZone"
import { findIdOnTree, makeTerminalSpace, removeTerminalUpdatePercents, terminalsInTree } from "./terminalsContextUtil"

export type DropzoneResizeHandle = {
    draggingTerminalId: number
    draggingTerminalTreeId: number
    setPositionHover: (show: boolean) => void
    currentId: number,
    currentTreeId: number
}

export const dropzoneResizeHandle = (node: HTMLElement, s: DropzoneResizeHandle) => {
    let state = s

    const onEnter = () => {
        state.setPositionHover(true)
    }

    const onLeave = () => {
        state.setPositionHover(false)
    }

    const onDrop = () => {
        state.setPositionHover(false)

        TerminalsCtx.update((prev) => {
            // remove terminal from prev location
            if(state.draggingTerminalTreeId !== state.currentTreeId) {
                const draggingTerminalTree = prev.trees[state.draggingTerminalTreeId].tree
                const treeDragging = findIdOnTree(draggingTerminalTree, state.draggingTerminalId)!
                
                removeTerminalUpdatePercents(treeDragging.tree.terminals, state.draggingTerminalId)

                if (terminalsInTree(draggingTerminalTree) === 0) {
                    delete prev.trees[state.draggingTerminalTreeId]
                }
            }

            // add to new location
            const current = findIdOnTree(prev.trees[state.currentTreeId].tree, state.currentId)!
            const percent = makeTerminalSpace(current.tree.terminals)

            current.tree.terminals.splice(current.idx +1, 0, {
                id: state.draggingTerminalId,
                percent,
                childs: null
            })

            prev.terminals[state.draggingTerminalId].treeId = state.currentTreeId
            return prev

        })
    }

    return dropZoneInner<DropzoneResizeHandle>({
        node,
        onEnter,
        onLeave,
        onDrop,
        onUpdate: (newState) => state = newState
    }) 
}