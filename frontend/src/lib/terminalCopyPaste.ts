import type { Terminal } from "xterm"
import { TerminalsCtx } from "../context/terminalsContext"
import { WsMessageKind, type WsMessage } from "./createConnection"

export const terminalWrite = (key: string, ws: WebSocket, terminalId: number) => {
    const msg: WsMessage = [WsMessageKind.Text, key]

    if (ws.readyState === WebSocket.CLOSED) {
        TerminalsCtx.removeTerminal(terminalId)
    } else {
        ws.send(JSON.stringify(msg))
    }
}

export const terminalPaste = (ws: WebSocket, terminalId: number) => {
    navigator.clipboard.readText().then((txt) => {
        terminalWrite(txt, ws, terminalId)
    })
}

export const terminalCopy = (terminal: Terminal) => {
    const txt = terminal.getSelection()
    if(txt) {
        navigator.clipboard.writeText(txt).then(() => {
            terminal.clearSelection()
        })
    }
}