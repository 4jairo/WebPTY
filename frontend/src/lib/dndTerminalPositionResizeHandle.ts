import { TerminalsCtx } from "../context/terminalsContext"
import { dropZoneInner } from "./dropZone"
import { findIdOnTree, makeTerminalSpace, removeTerminalUpdatePercentsUpdateTree } from "./terminalsContextUtil"

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
                removeTerminalUpdatePercentsUpdateTree(prev, draggingTerminalTree, state.draggingTerminalId)
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
    
    const onDrag = (e: DragEvent) => {
        if(state.draggingTerminalTreeId === state.currentTreeId) {
            e.dataTransfer!.dropEffect = 'none'
            return
        }
    }

    return dropZoneInner<DropzoneResizeHandle>({
        node,
        onEnter,
        onLeave,
        onDrop,
        onDrag,
        onUpdate: (newState) => state = newState
    }) 
}