import { Command } from 'commander'
import { LogLevel } from './log'

const parseLogLevel = (cliValue: string, defaultValue: LogLevel) => {
    switch (cliValue) {
        case 'info': return LogLevel.Info
        case 'warn': return LogLevel.Warn
        case 'error': return LogLevel.Error            
        default: return defaultValue
    }
}

const program = new Command()
program
    .name('WebPTY')
    .version('1.0.0')
    .description('A web-based terminal emulator')

program
    .option('-p --port <port>', 'Port to listen on', parseInt, 8900)
    .option('--local', `Use only localhost`, false)
    .option('-s, --shells <shells...>', 'Available shells, first shell is the default shell', [])
    .option('--default <shell>', 'Change default shell')
    .option('-m, --max-connections <max>', 'Maximum number of connections', parseInt, 50)
    .option<LogLevel>('-l, --log-level <level>', 'Log level', parseLogLevel, LogLevel.Info)

export type CliArgsType = {
    port: number
    local: boolean
    shells: string[]
    default?: string
    maxConnections: number
    logLevel: LogLevel
}

export const CliArgs: CliArgsType = program.parse(process.argv).opts()