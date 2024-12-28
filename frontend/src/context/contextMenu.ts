import type { Component } from "svelte"

export const enum TabMenuPage {
    Home,
    Rename,
    ChangeColors,
    NewTab,
}

export const enum TerminalMenuPage {
    Home
}

export type MenuOptions = {
    txt: string,
    icon: Component,
    fn: (e: MouseEvent & {currentTarget: EventTarget & HTMLElement}) => void,
    separation?: boolean,
    disabled?: boolean
}

export type CommonContextMenuProps<T> = { 
    x: number, 
    y: number, 
    terminalId: number, 
    menuPage?: T
}