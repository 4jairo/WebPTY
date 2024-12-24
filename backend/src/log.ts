import chalk from 'chalk'
import { CliArgs } from './cli'


function timestamp() {
    return chalk.gray(new Date().toISOString())
}

function info(msg: any) {
    if(LogLevel.Info <= logLevel) {
        console.info(`[${timestamp()}] ${chalk.blue('INFO')}: ${msg}`)
    }
}

function warn(msg: any) {
    if(LogLevel.Warn <= logLevel) {
        console.warn(`[${timestamp()}] ${chalk.yellow('WARN')}: ${msg}`)
    }
}

function error(msg: any) {
    if(LogLevel.Error <= logLevel) {
        console.error(`[${timestamp()}] ${chalk.red('ERROR')}: ${msg}`)
    }
}


export const enum LogLevel {
    Error,
    Warn,
    Info,
}

let logLevel = CliArgs.logLevel


export const logger = {
    info, 
    warn,
    error,
}


