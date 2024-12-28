import exrpess from 'express'
import type { Request as ExpressRequest  } from 'express'
import * as pty from 'node-pty'
import { appWs } from '../express'
import { CliArgs } from '../cli'
import { logger } from '../log'
import { shellsInfo } from './getInfo'

const wsRouter = exrpess.Router()

const enum WsMessageKind {
    Resize,
    Text
}

type WsMessage = 
// cols, rows
| [WsMessageKind.Resize, number, number]
// text
| [WsMessageKind.Text, string]


function isValidStatusCode(code: number) {
    return (
        code >= 1000 && 
        code <= 1014 &&
        code !== 1004 &&
        code !== 1005 &&
        code !== 1006
    ) || (code >= 3000 && code <= 4999)
}

const getShell = (req: ExpressRequest) => {
    if(typeof req.query.shell !== 'string' || req.query.shell.length === 0) {
        if(shellsInfo.shells.length) {
            return shellsInfo.shells[shellsInfo.defaultShell]
        }
    }
    return req.query.shell as string | undefined
}


const sockets = appWs.getWss().clients
const canSpawnTerminal = (req: ExpressRequest) => {
    // max connections
    if(sockets.size > CliArgs.maxConnections) {
        logger.warn(`Server has reached the maximum number of connections (${CliArgs.maxConnections})`)

        return {
            error: 'Server has reached the maximum number of connections'
        }
    }
    
    // valid shell
    const shell = getShell(req)
    if(!shell || (CliArgs.shells.length > 0 && !CliArgs.shells.includes(shell))) {
        logger.warn(`${req.socket.remoteAddress} tried to use the shell '${shell}'`)

        return {
            error: `'${shell}' isn't a valid shell`
        }
    }

    return {
        error: null
    }
}

const EXIT_CODE = 3001
wsRouter.ws('/ws', (ws, req) => {
    const result = canSpawnTerminal(req)
    if(result.error) {
        ws.close(3000, result.error)
        return
    }

    logger.info(`Connection from ${req.socket.remoteAddress} (sockets alive: ${sockets.size})`)

    const shell = getShell(req)!

    let isTerminalAlive = true    
    const terminal = pty.spawn(shell, [], {})
    terminal.onData((data) => {
        if(ws.readyState === ws.OPEN) {
            ws.send(data)
        }
    })

    terminal.onExit(({ exitCode }) => {
        isTerminalAlive = false
        const code = isValidStatusCode(exitCode + EXIT_CODE)
            ?  exitCode + EXIT_CODE
            : EXIT_CODE

        if(ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
            ws.close(code)
        }
    })
    
    ws.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data as string) as WsMessage
            switch (msg[0]) {
                case WsMessageKind.Text: {
                    const [, text] = msg
                    terminal.write(text as string)
                    break
                }
                case WsMessageKind.Resize: {
                    const [, cols, rows] = msg
                    terminal.resize(cols, rows)
                    break
                }
            }
        } catch (error) {
            const errString = error instanceof Error ? error.message : String(error)
            logger.error(`Parse message error: ${errString}`)
        }
    }

    ws.onclose = () => {    
        try {
            process.kill(terminal.pid, 'SIGKILL')
        } catch {}
        // catch (error) {
        //     const errString = error instanceof Error ? error.message : String(error)
        //     logger.error(`Kill terminal error: ${errString}`)
        // }

        if(isTerminalAlive) {
            terminal.kill()
        }
    }
})

export default wsRouter