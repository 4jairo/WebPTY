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


export const createConnection = async (shell: string, customName: string = '', tabColor: string = '') => {
    if(!TerminalsCtx.canSpawnAnotherTerminal()) {
        return
    }
    
    const { terminal, ws } = await createConnectionInner(shell)
    terminal.loadAddon(new WebglAddon())
    terminal.loadAddon(new WebLinksAddon())
    terminal.loadAddon(new ClipboardAddon())

    const terminalId = TerminalsCtx.addTerminal(terminal, ws, shell, customName, tabColor)

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

const createConnectionInner = (shell: string) => {
    return new Promise((resolve, reject) => {
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
            resolve({ terminal, ws })
        }
        
        ws.onmessage = (e: MessageEvent<string>) => {
            terminal.write(e.data)
        }

        ws.onclose = (e) => {
            if(e.code >= 3000) {
                terminal.write(`\r\nExited with status code ${e.code - 3000}.\r\n`)
            } else {     
                terminal.write(`\r\nSocket closed with status code ${e.code}\r\n`)
            }
            
            terminal.write("Press enter to close the terminal")
            reject(e.code)
        }
    }) as Promise<{ terminal: Terminal, ws: WebSocket }>
}