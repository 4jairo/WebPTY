import { TerminalsCtx } from "../context/terminalsContext"
import { dropZoneInner } from "./dropZone"
import { makeTerminalSpace, findIdOnTree, removeTerminalUpdatePercentsUpdateTree } from "./terminalsContextUtil"

export type TerminalHoverDimensions = {
    x: number
    y: number
    width: number
    height: number
}

type DropzoneTerminalPosition = {
    draggingTerminalId: number
    draggingTerminalTreeId: number
    setPositionHover: (newValue: TerminalHoverDimensions | null) => void
    currentTerminalId: number
    currentTreeId: number
}

export const dropzoneTerminalPosition = (node: HTMLElement, s: DropzoneTerminalPosition) => {
    let state = s
    let dropPosition = -1

    const onDrop = () => {
        state.setPositionHover(null)

        if(dropPosition < 0) {
            return
        }

        TerminalsCtx.update((prev) => {
            // remove terminal from prev location
            if(state.draggingTerminalTreeId !== state.currentTreeId) {
                const draggingTerminalTree = prev.trees[state.draggingTerminalTreeId].tree
                removeTerminalUpdatePercentsUpdateTree(prev, draggingTerminalTree, state.draggingTerminalId)
            }

            // add to new location
            const treeCurrent = findIdOnTree(prev.trees[state.currentTreeId].tree, state.currentTerminalId)!
            const terminalsCurrent = treeCurrent.tree.terminals
            const newOrientation = dropPosition === 0 || dropPosition === 1
                ? 'column'
                : 'row'

            if(terminalsCurrent.length === 1) {
                treeCurrent.tree.orientation = newOrientation
                const percent = makeTerminalSpace(treeCurrent.tree.terminals)
                treeCurrent.tree.terminals = dropPosition === 0 || dropPosition === 2 
                    ? [
                        { id: state.draggingTerminalId, percent, childs: null },
                        treeCurrent.tree.terminals[0], 
                    ]
                    : [
                        treeCurrent.tree.terminals[0],
                        { id: state.draggingTerminalId, percent, childs: null },
                    ]
            }
            else {
                const terminals = dropPosition === 0 || dropPosition === 2 
                    ? [
                        { id: state.draggingTerminalId, percent: 50, childs: null },
                        { id: terminalsCurrent[treeCurrent.idx].id!, percent: 50, childs: null },
                    ]
                    : [
                        { id: terminalsCurrent[treeCurrent.idx].id!, percent: 50, childs: null },
                        { id: state.draggingTerminalId, percent: 50, childs: null },
                    ]

                terminalsCurrent[treeCurrent.idx] = TerminalsCtx.createChildInner(terminalsCurrent[treeCurrent.idx].percent, {
                    orientation: newOrientation,
                    terminals
                })
            }

            prev.terminals[state.draggingTerminalId].treeId = state.currentTreeId
            return prev
        })
    }
    
    const onLeave = () => {
        state.setPositionHover(null)
    }
 
    const onDrag = (e: DragEvent) => {
        const { top, bottom, left, right } = node.getBoundingClientRect()

        const distances = [
            Math.abs(e.clientY - top),
            Math.abs(e.clientY - bottom), 
            Math.abs(e.clientX - left),
            Math.abs(e.clientX - right)
        ]
        const nearestSide = distances.indexOf(Math.min(...distances))

        if(state.draggingTerminalTreeId === state.currentTreeId) {
            e.dataTransfer!.dropEffect = 'none'
            return
        } 
        
        dropPosition = nearestSide
        switch (nearestSide) {
            case 0: // top
                state.setPositionHover({
                    x: 0, 
                    y: 0,
                    width: 100,
                    height: 50,
                })
            break
            case 1: // bottom
                state.setPositionHover({
                    x: 0,
                    y: 50,
                    width: 100,
                    height: 50,
                })
            break
            case 2: // left
                state.setPositionHover({
                    x: 0, 
                    y: 0,
                    width: 50,
                    height: 100,
                })
            break
            case 3: // right
                state.setPositionHover({
                    x: 50, 
                    y: 0,
                    width: 50,
                    height: 100,
                })
            break
        }
    }

    return dropZoneInner<DropzoneTerminalPosition>({
        node,
        onLeave,
        onDrag,
        onDrop,
        onUpdate: (newState) => state = newState
    })
}