import exrpess from 'express'
import * as pty from 'node-pty'
import { appWs } from '../express'
import { CliArgs } from '../cli'
import { logger } from '../log'

const wsRouter = exrpess.Router()

const enum WsMessageKind {
    Resize,
    Text
}

type WsMessage = 
| { kind: WsMessageKind.Resize, rows: number, cols: number }
| { kind: WsMessageKind.Text, text: string }


function isValidStatusCode(code: number) {
    return (
        code >= 1000 && 
        code <= 1014 &&
        code !== 1004 &&
        code !== 1005 &&
        code !== 1006
    ) || (code >= 3000 && code <= 4999)
}


const sockets = appWs.getWss().clients
wsRouter.use((req, res, next) => {
    if(req.headers.upgrade !== 'websocket' || sockets.size <= CliArgs.maxConnections) {
        return next()
    }

    logger.warn(`Server has reached the maximum number of connections (${CliArgs.maxConnections})`)

    res.status(500).json({
        error: 'Server has reached the maximum number of connections'
    })
})


wsRouter.ws('/ws', (ws, req) => {
    logger.info(`Connection from ${req.socket.remoteAddress} (sockets alive: ${sockets.size})`)

    let shell = req.query.shell
    if(typeof shell !== 'string' || shell.length === 0) {
        shell = 'pwsh.exe'
    }

    let isTerminalAlive = true
    const terminal = pty.spawn(shell, [], {})
    terminal.onData((data) => {
        if(ws.readyState === ws.OPEN) {
            ws.send(data)
        }
    })

    terminal.onExit(({ exitCode }) => {
        isTerminalAlive = false
        const code = isValidStatusCode(exitCode + 3000)
            ?  exitCode + 3000
            : 3000

        if(ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
            ws.close(code)
        }
    })
    
    ws.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data as string) as WsMessage
            switch (msg.kind) {
                case WsMessageKind.Text: {
                    terminal.write(msg.text as string)
                    break
                }
                case WsMessageKind.Resize: {
                    terminal.resize(msg.cols, msg.rows)
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