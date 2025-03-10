import { FitAddon } from "@xterm/addon-fit"
import { get, writable } from "svelte/store"
import type { Terminal } from "xterm"
import { removeTerminalUpdatePercentsUpdateTree, walkTerminals } from "../lib/terminalsContextUtil"


export type TerminalProps = {
    terminal: Terminal,
    fitAddon: FitAddon
    treeId: number
    ws: WebSocket
    shell: string
    customName: string
    tabColor: string
}

export type TerminalTreeProps = {
    tree: TerminalTreeRecursive,
    customName: string
    treeColor: string
}

export type TerminalTreeRecursive = {
    orientation: 'row' | 'column'
    terminals: { 
        percent: number, 
        id: number, 
        childs: TerminalTreeRecursive | null 
    }[]
}

export type TerminalsCtxProps = {
    terminals: {
        [id: string]: TerminalProps
    },
    trees: {
        [id: string]: TerminalTreeProps
    },
    order: number[],
    currentTerminal: number,
    currentTreeId: number,
    draggingTerminalId: number,
    isDragging: boolean
}

const createTree = (terminalId: number, customName = '', treeColor = ''): TerminalTreeProps => ({
    tree: {
        orientation: 'column',
        terminals: [{ id: terminalId, percent: 100, childs: null }]
    },
    customName,
    treeColor
})


const createContext = () => {
    let nextTerminalId = 0
    let nextTerminalTreeId = 0
    
    const State = writable<TerminalsCtxProps>({
        currentTerminal: 0,
        currentTreeId: 0,
        draggingTerminalId: 0,
        trees: {},
        order: [],
        terminals: {},
        isDragging: false
    })

    const createChildInner = (percent: number, childs: TerminalTreeRecursive) => {
        return {
            percent, 
            childs,
            id: ++nextTerminalId,
        }
    }

    const addTerminal = (
        terminal: Terminal, 
        ws: WebSocket, 
        shell: string,
        terminalCustomName = '',
        tabColor = '',
        treeCustomName = '',
        treeColor = ''
    ) => {
        const terminalId = ++nextTerminalId
        const treeId = ++nextTerminalTreeId

        State.update(prev => {
            const fitAddon = new FitAddon()
            terminal.loadAddon(fitAddon)

            prev.terminals[terminalId] = {
                terminal, 
                ws, 
                shell,
                fitAddon,
                customName: terminalCustomName,
                tabColor,
                treeId
            }

            prev.trees[treeId] = createTree(terminalId, treeCustomName, treeColor)

            prev.order.push(terminalId)
            prev.currentTerminal = terminalId
            prev.currentTreeId = treeId
            return prev
        })

        return terminalId
    }

    const canSpawnAnotherTerminal = () => {
        return Object.keys(get(State).terminals).length < 50
    }

    const setTerminalOrder = (terminalId: number, newIdx: number) => {
        State.update((prev) => {
            prev.order = prev.order.filter((t) => t !== terminalId)
            prev.order.splice(newIdx, 0, terminalId)    
            return prev
        })
    }

    const setCurrentTerminalInner = (prev: TerminalsCtxProps, terminalId: number | string) => {
        if (!prev.terminals[terminalId]) {
            const terminals = Object.keys(prev.terminals)

            prev.currentTerminal = terminals.length === 0
                ? 0
                : parseInt(terminals[terminals.length -1])
        } else {
            prev.currentTerminal = parseInt(terminalId as string)
        }
        
        prev.currentTreeId = prev.terminals[prev.currentTerminal]?.treeId || 0
    }

    const setCurrentTerminal = (terminalId: number | string) => {
        State.update(prev => {
            setCurrentTerminalInner(prev, terminalId)            
            return prev
        })
    }

    /// setCurrentTerminal is called
    const setDraggingTerminal = (terminalId: number) => {
        State.update(prev => {
            if(!prev.terminals[terminalId]) {
                return prev
            }
            setCurrentTerminalInner(prev, terminalId)
            prev.draggingTerminalId = terminalId
            return prev
        })
    }
    
    const altTabTree = (direction: boolean) => {
        State.update(prev => {
            const treeIds = Object.keys(prev.trees).map(Number)
            const currentTreeIdx = treeIds.findIndex((id) => id === prev.currentTreeId)
            const newTreeIdx = currentTreeIdx + (direction ? 1 : -1)

            if (newTreeIdx < 0) {
                prev.currentTreeId = treeIds[treeIds.length - 1]
            } else if (newTreeIdx > treeIds.length -1) {
                prev.currentTreeId = treeIds[0]
            } else {
                prev.currentTreeId = treeIds[newTreeIdx]
            }

            const terminalsInNewTree: number[] = []
            walkTerminals(prev.trees[prev.currentTreeId].tree, (termId) => {
                terminalsInNewTree.push(termId)
            })

            prev.currentTerminal = terminalsInNewTree[0]
            return prev
        }) 
    }

    const altTabTerminal = (direction: boolean) => {
        State.update((prev) => {
            if(!prev.terminals[prev.currentTerminal]) {
                return prev
            }

            const terminalsId: number[] = []
            walkTerminals(prev.trees[prev.currentTreeId].tree, (termId) => {
                terminalsId.push(termId)
            })

            const currentTerminalIdx = terminalsId.findIndex((t) => t === prev.currentTerminal)
            const newCurrTerminal = currentTerminalIdx + (direction ? 1 : -1)

            if(newCurrTerminal < 0) {
                setCurrentTerminalInner(prev, terminalsId[terminalsId.length -1])
            } else if(newCurrTerminal > terminalsId.length -1) {
                setCurrentTerminalInner(prev, terminalsId[0])
            } else {
                setCurrentTerminalInner(prev, terminalsId[newCurrTerminal])
            }

            prev.terminals[prev.currentTerminal].terminal.focus()

            return prev
        })
    }

    const setIsDragging = (newValue: boolean) => {
        State.update(prev => {
            prev.isDragging = newValue
            return prev
        })
    }

    const setTerminalProp = <T extends keyof TerminalProps>(terminalId: number | string, key: T, value: TerminalProps[T]) => {
        State.update(prev => {
            if (!prev.terminals[terminalId]) return prev

            prev.terminals[terminalId][key] = value
            return prev
        })
    }

    const setTreeProp = <T extends keyof TerminalTreeProps>(treeId: number | string, key: T, value: TerminalTreeProps[T]) => {
        State.update(prev => {
            if (!prev.trees[treeId]) return prev

            prev.trees[treeId][key] = value
            return prev
        })
    }

    const removeTerminalFromTree = (id: string | number) => {
        const treeId = ++nextTerminalTreeId

        State.update(prev => {
            if(prev.terminals[id] === null) return prev

            // update `prev.trees`
            const treeRoot = prev.trees[prev.terminals[id].treeId].tree
            const idNumber = typeof id === 'string' ? parseInt(id) : id
            removeTerminalUpdatePercentsUpdateTree(prev, treeRoot, idNumber)
            
            // create new tree
            prev.trees[treeId] = createTree(idNumber)
            prev.terminals[id].treeId = treeId
            prev.currentTerminal = idNumber
            prev.currentTreeId = treeId
            
            return prev
        })
    }

    const removeTerminal = (id: string | number) => {
        State.update(prev => {
            if(prev.terminals[id] === null) return prev
            
            // close websocket and xterm.js
            prev.terminals[id].ws.onclose = null
            prev.terminals[id].ws.close()
            prev.terminals[id].terminal.dispose()

            // update `prev.trees`
            const treeRoot = prev.trees[prev.terminals[id].treeId].tree
            const idNumber = typeof id === 'string' ? parseInt(id) : id
            removeTerminalUpdatePercentsUpdateTree(prev, treeRoot, idNumber)

            delete prev.terminals[id]

            // remove from `prev.order`
            prev.order = prev.order.filter((t) => t !== idNumber)

            // update `prev.currentTerminal` and `prev.currentTreeId`
            const terminals = Object.keys(prev.terminals)
            prev.currentTerminal = terminals.length === 0
                ? 0
                : parseInt(terminals[terminals.length -1])

            prev.currentTreeId = prev.terminals[prev.currentTerminal]
                ? prev.terminals[prev.currentTerminal].treeId
                : 0

            return prev
        })
    }

    return {
        subscribe: State.subscribe,
        update: State.update,
        addTerminal,
        createChildInner,
        altTabTerminal,
        altTabTree,
        removeTerminal,
        removeTerminalFromTree,
        setCurrentTerminal,
        setDraggingTerminal,
        setIsDragging,
        canSpawnAnotherTerminal,
        setTerminalOrder,
        setTabCustomName: (terminalId: string | number, name: string) => setTerminalProp(terminalId, 'customName', name),
        setTabColor: (terminalId: string | number, color: string) => setTerminalProp(terminalId, 'tabColor', color),
        setTreeColor: (treeId: string | number, color: string) => setTreeProp(treeId, 'treeColor', color),
        setTreeCustomName: (treeId: string | number, name: string) => setTreeProp(treeId, 'customName', name),
    }
}

export const TerminalsCtx = createContext()