import { TerminalsCtx } from '../context/terminalsContext'
import { dropZoneInner } from './dropZone'

type DropzoneTabOrderState = {
    currentTerminal: number,
    tabWidth: number,
    tabsOrder: number[],
    draggingTerminalIdx: number
    setDraggingHoverPosition: (v: number | null) => void
}

export const dropzoneTabOrder = (node: HTMLElement, s: DropzoneTabOrderState) => {
    let state = s

    let tabIdx = -1
    const onDrag = (e: DragEvent) => {
        tabIdx = Math.floor(e.clientX / state.tabWidth)
        if(state.currentTerminal !== state.tabsOrder[tabIdx]) {
            TerminalsCtx.setCurrentTerminal(state.tabsOrder[tabIdx])
        }

        const maxPosition = (state.tabsOrder.length * state.tabWidth) -2
        const draggingHoverPosition = Math.min((tabIdx * state.tabWidth) -2, maxPosition)
        state.setDraggingHoverPosition(draggingHoverPosition)
    }

    const onDrop = () => {
        TerminalsCtx.setTerminalOrder(state.draggingTerminalIdx, tabIdx)
        state.setDraggingHoverPosition(null)
    }

    const onLeave = () => {
        state.setDraggingHoverPosition(null)
    }

    return dropZoneInner<DropzoneTabOrderState>({
        node,
        onLeave,
        onDrop,
        onDrag,
        onUpdate: (newState) => state = newState,
    })
}
