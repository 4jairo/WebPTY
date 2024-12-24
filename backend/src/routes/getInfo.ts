import express from 'express'
import fs from 'node:fs'
import { exec, execSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import { CliArgs } from '../cli'
import { URLFormatOptions } from 'node:url'

const infoRouter = express.Router()

const shells = os.platform() === 'win32' ? getShellsWin() : getShellsUnix()

infoRouter.get('/info', (_, res) => {
    res.json(shells)
})

type ShellInfo = {
    shells: string[]
    defaultShell: number
    colors?: {
        background: string
        black: string
        blue: string
        brightBlack: string
        brightBlue: string
        brightCyan: string
        brightGreen: string
        brightPurple: string
        brightRed: string
        brightWhite: string
        brightYellow: string
        cursorColor: string
        cyan: string
        foreground: string
        green: string
        name: string
        purple: string
        red: string
        selectionBackground: string
        white: string
        yellow: string
    }
    font?: string
    maxConnections: number
}

function getShellsUnix() {
    const shellsInfo: ShellInfo = {
        shells: [],
        defaultShell: 0,
        maxConnections: CliArgs.maxConnections,
    }

    if (CliArgs.shells.length) {
        shellsInfo.shells = CliArgs.shells
    } else {  
        shellsInfo.shells = fs.readdirSync('/etc/shells')
    }

    if(CliArgs.default) {
        const defaultShellIdx = shellsInfo.shells.findIndex((s) => s === CliArgs.default)
        if(defaultShellIdx !== -1) {
            shellsInfo.defaultShell = defaultShellIdx
        }
    }
}
 
function getShellsWin() {
    const shellsInfo: ShellInfo = {
        shells: [],
        defaultShell: 0,
        maxConnections: CliArgs.maxConnections,
    }

    if (CliArgs.shells.length) {
        shellsInfo.shells = CliArgs.shells
    } else {  
        shellsInfo.shells.push('cmd.exe')

        for (const shell of ['powershell.exe', 'pwsh.exe', 'wsl.exe', 'bash.exe']) {
            try {
                execSync(`where /q ${shell}`)
                shellsInfo.shells.push(shell)
            } catch {}

            // exec(`where /q ${shell}`).on('exit', (code) => {
            //     if(code === 0) shellsInfo.shells.push(shell)
            // })
        }
    }

    const windowsTerminalConfigPath = path.join(
        process.env.LOCALAPPDATA as string,
        'Packages',
        'Microsoft.WindowsTerminal_8wekyb3d8bbwe',
        'LocalState',
        'settings.json'
    )

    if(fs.existsSync(windowsTerminalConfigPath)) {
        const cfg = JSON.parse(fs.readFileSync(windowsTerminalConfigPath).toString())
        shellsInfo.font = cfg.profiles.defaults.font.face
        shellsInfo.colors = cfg.schemes.find((schema: { name: string }) => schema.name === cfg.profiles.defaults.colorScheme)
    }

    if(CliArgs.default) {
        const defaultShellIdx = shellsInfo.shells.findIndex((s) => s === CliArgs.default)
        if(defaultShellIdx !== -1) {
            shellsInfo.defaultShell = defaultShellIdx
        }
    }

    return shellsInfo
}

export default infoRouter