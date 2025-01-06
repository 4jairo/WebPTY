import { ClipboardAddon } from "@xterm/addon-clipboard"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { WebglAddon } from "@xterm/addon-webgl"
import { Terminal } from "xterm"
import { TerminalsCtx } from "../context/terminalsContext"
import { get } from "svelte/store"
import { DEFAULT_FONTS, ShellsCtx } from "../context/shellsContext"
import { BASE_API_WS_URL } from "../context/apiUrl"
import { terminalCopy, terminalPaste, terminalWrite } from "./terminalCopyPaste"

export const enum WsMessageKind {
    Resize,
    Text
}

export type WsMessage = 
// cols, rows
| [WsMessageKind.Resize, number, number] 
// text
| [WsMessageKind.Text, string]

export const createConnection = async (shell: string, terminalCustomName = '', tabColor = '', treeCustomName = '', treeColor = '') => {
    if(!TerminalsCtx.canSpawnAnotherTerminal()) {
        return
    }

    const { terminal, ws } = await createConnectionInner(shell)
    terminal.loadAddon(new WebglAddon())
    terminal.loadAddon(new WebLinksAddon())
    terminal.loadAddon(new ClipboardAddon())

    const terminalId = TerminalsCtx.addTerminal(terminal, ws, shell, terminalCustomName, tabColor, treeCustomName, treeColor)

    terminal.attachCustomKeyEventHandler((e) => {
        if(!e.ctrlKey || !e.shiftKey || e.type === 'keyup') {
            return true
        }

        if(e.key === 'C') {
            e.preventDefault()
            terminalCopy(terminal)
        } else if (e.key === 'V') {
            e.preventDefault()
            terminalPaste(ws, terminalId)
        }

        return false
    })

    terminal.onKey(({ key, domEvent }) => {
        if(key === `\x7F` && domEvent.ctrlKey) {
            key = `\x17` // ctrl + w
        }
        terminalWrite(key, ws, terminalId)
    })
}

const EXIT_CODE = 3001
const createConnectionInner = (shell: string) => {
    return new Promise((resolve) => {
        const ws = new WebSocket(`${BASE_API_WS_URL}/ws?shell=${shell}`)
        const { s: defaultValues } = get(ShellsCtx)
    
        const font = defaultValues?.font.exists
            ? defaultValues?.font.value!
            : DEFAULT_FONTS

        const terminal = new Terminal({
            fontFamily: font,
            cursorStyle: 'bar',
            cursorBlink: true,
            cursorInactiveStyle: 'bar',
            rightClickSelectsWord: false,
            allowTransparency: true,
            macOptionClickForcesSelection: true,
            theme: defaultValues?.colors
        })
        
        if(defaultValues && !defaultValues.font.exists && defaultValues.font.value) {
            terminal.write(`\r\nFont '${defaultValues.font.value}' is not installed, using fallback fonts\r\n`)
        }

        terminal.onResize(({ cols, rows }) => {
            const msg: WsMessage = [WsMessageKind.Resize, cols, rows]
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