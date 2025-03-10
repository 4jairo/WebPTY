import { readable } from "svelte/store";
import type { TerminalHoverDimensions } from "../lib/dndTerminalPosition";
import { TerminalsCtx, type TerminalTreeRecursive } from "./terminalsContext";

export type Neighbors = {
    top: number | null
    bottom: number | null,
    left: number | null,
    right: number | null
}

export type DimensionsCtx = {
    [treeId: string]: {
        terminals: {
            [terminalId: string]: TerminalHoverDimensions
        },
        separations: {
            [id: string]: TerminalHoverDimensions
        }
    }
}

export const TerminalDimensionsCtx = readable<DimensionsCtx>({}, (set) => {
    return TerminalsCtx.subscribe((terminalsCtx) => {
        const newState: DimensionsCtx = {}

        for (const treeId in terminalsCtx.trees) {
            newState[treeId] = {
                terminals: {},
                separations: {}
            }
            getAllTerminalDimensions2(terminalsCtx.trees[treeId].tree, newState[treeId])
        }
        set(newState)
    })
})



const getAllTerminalDimensions2 = (
    tree: TerminalTreeRecursive,
    terminalDimensions: DimensionsCtx[''],
    parentWidth: number = 100,
    parentHeight: number = 100,
    offsetX: number = 0,
    offsetY: number = 0,
) => {
    let currentOffsetX = offsetX;
    let currentOffsetY = offsetY;

    for (let i = 0; i < tree.terminals.length; i++) {
        const terminal = tree.terminals[i]

        // Calculate width and height based on orientation and percent
        const width = tree.orientation === 'row' ? (parentWidth * terminal.percent) / 100 : parentWidth
        const height = tree.orientation === 'column' ? (parentHeight * terminal.percent) / 100 : parentHeight

        if(i < tree.terminals.length -1) {
            terminalDimensions.separations[terminal.id] = tree.orientation === 'row'
                ? {
                    x: currentOffsetX + width,
                    y: currentOffsetY,
                    width: 0,
                    height: height
                }
                : {
                    x: currentOffsetX,
                    y: currentOffsetY + height,
                    width: width,
                    height: 0,
                }
        }

        if (!terminal.childs) {
            terminalDimensions.terminals[terminal.id] = {
                x: currentOffsetX,
                y: currentOffsetY,
                width,
                height,
            }
        } else {
            getAllTerminalDimensions2(
                terminal.childs,
                terminalDimensions,
                width,
                height,
                currentOffsetX,
                currentOffsetY
            )
        }

        // Update offsets for the next terminal
        if (tree.orientation === 'row') {
            currentOffsetX += width
        } else {
            currentOffsetY += height
        }
    }
}