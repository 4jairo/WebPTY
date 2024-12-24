import type { TerminalTreeRecursive } from "../context/terminalsContext"

export const walkTerminals = (tree: TerminalTreeRecursive, cb: (terminalId: number) => void) => {
    for (const term of tree.terminals) {
        if(term.childs) {
            walkTerminals(term.childs, cb)
        } else {
            cb(term.id)
        }
    }    
}

export const terminalsInTree = (tree: TerminalTreeRecursive) => {
    let total = 0
    for (const term of tree.terminals) {
        if(term.childs) {
            total += terminalsInTree(term.childs)
        } else {
            total++
        }
    }

    return total
}

type findTerminalListType = { tree: TerminalTreeRecursive, idx: number }
export const findIdOnTree = (tree: TerminalTreeRecursive, terminalId: number): findTerminalListType | undefined => {
    for (let i = 0; i < tree.terminals.length; i++) {
        const term = tree.terminals[i]

        if(term.id === terminalId) {
            return {
                tree,
                idx: i
            }
        }

        if(term.childs) {
            const result = findIdOnTree(term.childs, terminalId)
            if(result) return result
        }
    }
}


export const removeTerminalUpdatePercents = (terminals: TerminalTreeRecursive['terminals'], terminalId: number) => {
    const terminalIdx = terminals.findIndex(({ id }) => id === terminalId)
    if(terminalIdx === -1) {
        return
    }
    const { percent } = terminals.splice(terminalIdx, 1)[0]

    for (let i = 0; i < terminals.length; i++) {
        const term = terminals[i];
        term.percent += percent / terminals.length
    }
}


const percentInRange = (percent: number) => {
    return Math.min(85, Math.max(15, percent))
}

export const makeTerminalSpace = (terminals: TerminalTreeRecursive['terminals']) => {
    if(!terminals.length) {
        return 100
    }

    let newTerminalPercent = percentInRange(100 / (terminals.length +1))
    let total = newTerminalPercent
    for (let i = 0; i < terminals.length; i++) {
        const term = terminals[i]
        term.percent = percentInRange(term.percent * (1 - newTerminalPercent / 100))
        total += term.percent
    }

    if(total > 100) {
        const excess = total - 100
        newTerminalPercent -= excess / (terminals.length +1)

        for (let i = 0; i < terminals.length; i++) {
            const term = terminals[i]
            term.percent -= excess / (terminals.length +1)
        }
    }

    return newTerminalPercent
}

export const updateTerminalPercent = (terminals: TerminalTreeRecursive['terminals'], terminalId: number, percentValue: number) => {
    const terminalIdx = terminals.findIndex(({ id }) => id === terminalId)
    if(terminalIdx === -1) {
        return
    }
    
    const newTerminalPercent = percentInRange(terminals[terminalIdx].percent - percentValue)
    let total = newTerminalPercent

    for (let i = 0; i < terminals.length; i++) {
        const term = terminals[i]
        if(term.id === terminalId) {
            term.percent = newTerminalPercent
        } else {
            term.percent = percentInRange(term.percent + percentValue / (terminals.length - 1))
            total += term.percent
        }
    }

    if(total > 100) {
        const excess = total - 100

        for (let i = 0; i < terminals.length; i++) {
            const term = terminals[i]
            term.percent -= excess / terminals.length
        }
    }
}