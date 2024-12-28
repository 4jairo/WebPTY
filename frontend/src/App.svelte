<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { TerminalsCtx, type TerminalProps } from "./context/terminalsContext";
    import { defaultBgc, ShellsCtx } from "./context/shellsContext";
    import TerminalTabs from "./components/terminalTabs/tabs.svelte";
    import Terminal from "./components/terminal/terminal.svelte";
    import { walkTerminals } from "./lib/terminalsContextUtil";
    import { TerminalDimensionsCtx } from "./context/terminalsDimensionsContext";
    import ResizeHandle from "./components/resizeHandle/resizeHandle.svelte";
    import type { CommonContextMenuProps, TerminalMenuPage } from "./context/contextMenu";
    import TerminalContextMenu from "./components/terminalContextMenu/terminalContextMenu.svelte";

    $: terminalsCtx = $TerminalsCtx
    $: shellsCtx = $ShellsCtx
    $: terminalDimensionsCtx = $TerminalDimensionsCtx
    $: {
        if(terminalsCtx.terminals[terminalsCtx.currentTerminal]) {
            const { shell, customName } = terminalsCtx.terminals[terminalsCtx.currentTerminal]
            document.title = customName || shell
        } else {
            document.title = 'webpty'
        }
    }
    let contextMenuProps: CommonContextMenuProps<TerminalMenuPage> & { currentTerminal: TerminalProps } | null = null

    const closeContextMenu = () => {
        contextMenuProps = null
        if(terminalsCtx.terminals[terminalsCtx.currentTerminal]) {
            terminalsCtx.terminals[terminalsCtx.currentTerminal].terminal.focus()
        }
    }

    const windowOnResize = () => {
        const currentTree = terminalsCtx.trees[terminalsCtx.currentTreeId]
        if(!currentTree) {
            return
        }

        walkTerminals(currentTree.tree, (terminalId) => {
            terminalsCtx.terminals[terminalId].fitAddon.fit()
        })
    }

    onMount(() => window.addEventListener('resize', windowOnResize))
    onDestroy(() => window.removeEventListener('resize', windowOnResize))
</script>


<main style="background-color: {defaultBgc(shellsCtx.s)}">
    <TerminalTabs />

    {#if contextMenuProps}
        <TerminalContextMenu closeMenu={closeContextMenu} {...contextMenuProps}/>
    {/if}

    <div class="terminals">
        {#each Object.entries(terminalDimensionsCtx[terminalsCtx.currentTreeId]?.separations || {}) as [id, position]}
            <ResizeHandle {position} currentId={parseInt(id)}/>
        {/each}

        <!-- (terminalId) at the end specifies the key for each element (instead of the array idx) -->
        {#each Object.keys(terminalsCtx.terminals) as terminalId (terminalId)}
            <Terminal {terminalId} setContextMenuProps={(p) => contextMenuProps = p}/>
        {/each}
    </div>
</main>


<style>
    main {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }
    .terminals {
        flex: 1;
        position: relative;
    }
</style>