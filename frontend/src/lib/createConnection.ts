import { ClipboardAddon } from "@xterm/addon-clipboard"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { WebglAddon } from "@xterm/addon-webgl"
import { Terminal } from "xterm"
import { TerminalsCtx } from "../context/terminalsContext"
import { get } from "svelte/store"
import { DEFAULT_FONTS, ShellsCtx } from "../context/shellsContext"
import { BASE_API_WS_URL } from "../context/apiUrl"
import { terminalCopy, terminalPaste, terminalWrite } from "./terminalCopyPaste"
import { SpecialKeysContext } from "../context/specialKeysContext"

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

    const checkCtrlShiftKeys = (e: KeyboardEvent) => {
        if(e.type === 'keyup') return true

        switch (e.key) {
            case 'C':
                e.preventDefault()
                terminalCopy(terminal)
                return false
            case 'V':
                e.preventDefault()
                terminalPaste(ws, terminalId)
                return false
            default:
                return true
        }
    }

    const keysPressed = {
        t: false,
        w: false,
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDowm: false
    }
    const checkCtrlAltKeys = (e: KeyboardEvent) => {
        if(e.type === 'keyup') {
            if (e.key in keysPressed) {
                keysPressed[e.key as keyof typeof keysPressed] = false
            }
            return true
        }

        if (e.key in keysPressed) {
            if (keysPressed[e.key as keyof typeof keysPressed]) {
                return false
            }
        }

        let returnValue = false
        switch (e.key) {
            case 't': {
                const shellsCtx = get(ShellsCtx)
                if(shellsCtx.s) {
                    createConnection(shellsCtx.s.shells[shellsCtx.s.defaultShell])
                }
                break
            }
            case 'w': {
                TerminalsCtx.removeTerminal(terminalId)
                break
            }
            case 'ArrowLeft': {
                TerminalsCtx.altTabTerminal(false)
                break
            }
            case 'ArrowRight': {
                TerminalsCtx.altTabTerminal(true)
                break
            }
            case 'ArrowUp': {
                TerminalsCtx.altTabTree(true)
                break
            }
            case 'ArrowDown': {
                TerminalsCtx.altTabTree(false)
                break
            }
            default:
                returnValue = true
        }

        if (e.key in keysPressed) {
            keysPressed[e.key as keyof typeof keysPressed] = true
        }

        return returnValue
    }

    terminal.attachCustomKeyEventHandler((e) => {
        if(e.ctrlKey && e.shiftKey) {
            return checkCtrlShiftKeys(e)
        }
        if(e.ctrlKey && e.altKey) {
            SpecialKeysContext.set({ ctrlAltPressed: true })
            return checkCtrlAltKeys(e)
        } else {
            SpecialKeysContext.set({ ctrlAltPressed: false })
        }

        return true
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