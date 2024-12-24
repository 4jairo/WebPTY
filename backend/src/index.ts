// src/index.ts
import { appWs } from './express'
import express from 'express'
import wsRouter from "./routes/ws";
import infoRouter from './routes/getInfo';
import { CliArgs } from './cli';
import { logger } from './log';
import { join } from 'node:path'
 
const app = appWs.app


// __dirname === dist/backend
app.use(express.static(join(__dirname, '..', 'frontend')))

app.use('/api', wsRouter)
app.use('/api', infoRouter)

const server = app.listen(CliArgs.port  , CliArgs.local ? '127.0.0.1' : '0.0.0.0', () => {
    const otherAddr = CliArgs.local ? '' : ` and http://0.0.0.0:${CliArgs.port}`
    
	logger.info(`Server is running at http://localhost:${CliArgs.port}${otherAddr}`)
    logger.info(`Press Ctrl + C to stop receiving requests and gracefully shut down the server`)
})


let force = false
const shutDown = () => {
    if(force) {
        process.exit(0)
    } else {
        logger.info('Shutting down gracefully, press Ctrl + C again to force')
        force = true
        server.close(() => process.exit(0))
    }
}

process.on('SIGTERM', shutDown)
process.on('SIGINT', shutDown)
