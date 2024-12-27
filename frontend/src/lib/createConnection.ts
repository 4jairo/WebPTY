import { ClipboardAddon } from "@xterm/addon-clipboard"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { WebglAddon } from "@xterm/addon-webgl"
import { Terminal } from "xterm"
import { TerminalsCtx } from "../context/terminalsContext"
import { get } from "svelte/store"
import { ShellsCtx } from "../context/shellsContext"
import { BASE_API_WS_URL } from "../context/apiUrl"

const enum WsMessageKind {
    Resize,
    Text
}

type WsMessage = 
| { kind: WsMessageKind.Resize, rows: number, cols: number }
| { kind: WsMessageKind.Text, text: string }


export const createConnection = async (shell: string, terminalCustomName = '', tabColor = '', treeCustomName = '', treeColor = '') => {
    if(!TerminalsCtx.canSpawnAnotherTerminal()) {
        return
    }

    const { terminal, ws } = await createConnectionInner(shell)
    terminal.loadAddon(new WebglAddon())
    terminal.loadAddon(new WebLinksAddon())
    terminal.loadAddon(new ClipboardAddon())

    const terminalId = TerminalsCtx.addTerminal(terminal, ws, shell, terminalCustomName, tabColor, treeCustomName, treeColor)

    terminal.onKey(({ key, domEvent }) => {
        if(key === `\x7F` && domEvent.ctrlKey) {
            key = `\x17` // ctrl + w
        }

        const msg: WsMessage = {
            kind: WsMessageKind.Text,
            text: key
        }
        if (ws.readyState === WebSocket.CLOSED) {
            TerminalsCtx.removeTerminal(terminalId)
        } else {
            ws.send(JSON.stringify(msg))
        }
    })
}

const EXIT_CODE = 3001
const createConnectionInner = (shell: string) => {
    return new Promise((resolve) => {
        const ws = new WebSocket(`${BASE_API_WS_URL}/ws?shell=${shell}`)
        const { s: defaultValues } = get(ShellsCtx)

        const terminal = new Terminal({
            fontFamily: defaultValues?.font || 'courier-new, courier, monospace',
            cursorStyle: 'bar',
            cursorBlink: true,
            cursorInactiveStyle: 'bar',
            rightClickSelectsWord: true,
            allowTransparency: true,
            macOptionClickForcesSelection: true,
            theme: defaultValues?.colors
        })

        terminal.onResize(({ cols, rows }) => {
            const msg: WsMessage = {
                kind: WsMessageKind.Resize,
                cols, rows
            }
            ws.send(JSON.stringify(msg))
        })
        
        ws.onopen = () => {
            resolve({ terminal, ws, code: null })
        }
        
        ws.onmessage = (e: MessageEvent<string>) => {
            terminal.write(e.data)
        }

        ws.onclose = (e) => {
            if(e.code === 3000) {
                terminal.write(`\r\nSocket closed. ${e.reason}.\r\n`)
            } else if(e.code >= EXIT_CODE) {
                terminal.write(`\r\nExited with status code ${e.code - EXIT_CODE}.\r\n`)
            } else {     
                terminal.write(`\r\nSocket closed with status code ${e.code}\r\n`)
            }
            
            terminal.write("Press any key to close the terminal")
            resolve({ terminal, ws, code: e.code })
        }
    }) as Promise<{ terminal: Terminal, ws: WebSocket, code: number | null }>
}