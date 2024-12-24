import { readable } from "svelte/store"
import type { ITheme } from "xterm"
import { BASE_API_URL } from "./apiUrl"

type Colors = {
    background: string,
    black: string,
    blue: string,
    brightBlack: string,
    brightBlue: string,
    brightCyan: string,
    brightGreen: string,
    brightPurple: string,
    brightRed: string,
    brightWhite: string,
    brightYellow: string,
    cursorColor: string,
    cyan: string,
    foreground: string,
    green: string,
    name: string,
    purple: string,
    red: string,
    selectionBackground: string,
    white: string,
    yellow: string
}

type EndpointResponse = {
    shells: string[],
    defaultShell: number,
    colors?: Colors,
    font?: string,
    maxConnections: number
}

export type ShellInfo = {
    shells: string[],
    defaultShell: number,
    colors?: ITheme,
    font?: string,
    maxConnections: number
}

const tryFetch = async (maxTry: number) => {
    let lastTry = 0

    for (let i = 0; i < maxTry; i++) {
        try {
            if(Date.now() - lastTry < 1000) {
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000)
                })
            }
            lastTry = Date.now()

            const resp: EndpointResponse = await fetch(`${BASE_API_URL}/info`)
                .then((resp) => resp.json())
            
            const result: ShellInfo = {
                shells: resp.shells,
                defaultShell: resp.defaultShell,
                font: resp.font,
                maxConnections: resp.maxConnections
            }

            if(resp.colors) {
                result.colors = {
                    background: resp.colors.background,
                    black: resp.colors.black,
                    blue: resp.colors.blue,
                    brightBlack: resp.colors.brightBlack,
                    brightBlue: resp.colors.brightBlue,
                    brightCyan: resp.colors.brightCyan,
                    brightGreen: resp.colors.brightGreen,
                    brightMagenta: resp.colors.brightPurple,
                    brightRed: resp.colors.brightRed,
                    brightWhite: resp.colors.brightWhite,
                    brightYellow: resp.colors.brightYellow,
                    cyan: resp.colors.cyan,
                    foreground: resp.colors.foreground,
                    green: resp.colors.green,
                    magenta: resp.colors.purple,
                    red: resp.colors.red,
                    selectionBackground: resp.colors.selectionBackground,
                    white: resp.colors.white,
                    yellow: resp.colors.yellow,
                    cursor: resp.colors.cursorColor,
                }
            }

            return result
        } catch {
            console.log('try ' + i)
        }
    }
}

export const ShellsCtx = readable<{
    fetching: boolean,
    s?: ShellInfo
}>({ fetching: true }, (set) => {
    tryFetch(5).then((s) => {
        set({
            fetching: false,
            s
        })
    })
})

export const defaultBgc = (shellsCtx?: ShellInfo) => {
    return shellsCtx?.colors?.background || '#000'
}