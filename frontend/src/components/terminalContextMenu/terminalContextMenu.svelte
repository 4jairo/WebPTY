<script lang="ts">
    import { TerminalMenuPage, type MenuOptions } from "../../context/contextMenu";
    import { TerminalsCtx, type TerminalProps } from "../../context/terminalsContext";
    import DuplicateIcon from "../../icons/duplicateIcon.svelte";
    import PasteIcon from "../../icons/pasteIcon.svelte";
    import XIcon from "../../icons/xIcon.svelte";
    import { terminalCopy, terminalPaste } from "../../lib/terminalCopyPaste";
    import ContextMenuContainer from "../contextMenuUtil/contextMenuContainer.svelte";
    import MenuOption from "../contextMenuUtil/menuOption.svelte";

    export let x: number
    export let y: number
    export let terminalId: number
    export let closeMenu: () => void
    export let menuPage: TerminalMenuPage = TerminalMenuPage.Home
    export let currentTerminal: TerminalProps

    const menuOptions: MenuOptions[] = [
        {
            txt: 'Copy',
            fn: () => {
                terminalCopy(currentTerminal.terminal)
                closeMenu()
            },
            icon: DuplicateIcon,
            disabled: !currentTerminal.terminal.hasSelection()
        },
        {
            txt: 'Paste',
            fn: async () => {
                terminalPaste(currentTerminal.ws, terminalId)
                closeMenu()
            },
            icon: PasteIcon,
            separation: true
        },
        {
            txt: 'Close terminal',
            fn: () => {
                TerminalsCtx.removeTerminal(terminalId)
                closeMenu()
            },
            icon: XIcon,
        },
    ]
</script>

<ContextMenuContainer {x} {y} {closeMenu} {menuPage}>
    <!-- {#if menuPage === TerminalMenuPage.Home} -->
        {#each menuOptions as options, i}
            <MenuOption {...options} separation={options.separation && i !== menuOptions.length -1}/>
        {/each}
    <!-- {/if}  -->
</ContextMenuContainer>