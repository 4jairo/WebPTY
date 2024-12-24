import { FitAddon } from "@xterm/addon-fit"
import { get, writable } from "svelte/store"
import type { Terminal } from "xterm"
import { findIdOnTree, removeTerminalUpdatePercents, terminalsInTree } from "../lib/terminalsContextUtil"


export type TerminalProps = {
    terminal: Terminal
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
    draggingTerminalId: number
}

const createTree = (terminalId: number): TerminalTreeProps => ({
    tree: {
        orientation: 'column',
        terminals: [{ id: terminalId, percent: 100, childs: null }]
    },
    customName: '',
    treeColor: ''
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
        terminals: {}
    })

    const createChild = (percent: number, childs: TerminalTreeRecursive) => {
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
        customName: string = '',
        tabColor: string = ''
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
                customName,
                tabColor,
                treeId
            }

            prev.trees[treeId] = createTree(terminalId)

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
            const idNumber = typeof id === 'string' ? parseInt(id) : id
            const { tree } = findIdOnTree(prev.trees[prev.terminals[id].treeId].tree, idNumber)!
            removeTerminalUpdatePercents(tree.terminals, idNumber)

            if (terminalsInTree(tree) === 0) {
                delete prev.trees[prev.terminals[id].treeId]
            }
            
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
            const idNumber = typeof id === 'string' ? parseInt(id) : id
            const tree = findIdOnTree(prev.trees[prev.terminals[id].treeId].tree, idNumber)!
            removeTerminalUpdatePercents(tree.tree.terminals, idNumber)

            if (terminalsInTree(tree.tree) === 0) {
                delete prev.trees[prev.terminals[id].treeId]
            }

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
        createChild,
        removeTerminal,
        removeTerminalFromTree,
        setCurrentTerminal,
        setDraggingTerminal,
        canSpawnAnotherTerminal,
        setTerminalOrder,
        setTabCustomName: (terminalId: string | number, name: string) => setTerminalProp(terminalId, 'customName', name),
        setTabColor: (terminalId: string | number, color: string) => setTerminalProp(terminalId, 'tabColor', color),
        setTreeColor: (treeId: string | number, color: string) => setTreeProp(treeId, 'treeColor', color),
        setTreeCustomName: (treeId: string | number, name: string) => setTreeProp(treeId, 'customName', name),
    }
}

export const TerminalsCtx = createContext()