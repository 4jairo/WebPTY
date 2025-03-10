<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->

<script lang="ts">
    import 'xterm/css/xterm.css'
    import { onDestroy, onMount } from "svelte";
    import { TerminalsCtx, type TerminalProps } from "../../context/terminalsContext";
    import { dropzoneTerminalPosition, type TerminalHoverDimensions } from '../../lib/dndTerminalPosition';
    import { terminalsInTree } from '../../lib/terminalsContextUtil';
    import { lightOrDark } from '../../lib/isLightOrDark';
    import { defaultBgc, ShellsCtx } from '../../context/shellsContext';
    import XIcon from '../../icons/xIcon.svelte';
    import RemoveFromTreeIcon from '../../icons/removeFromTreeIcon.svelte';
    import { TerminalDimensionsCtx } from '../../context/terminalsDimensionsContext';
    import type { CommonContextMenuProps, TerminalMenuPage } from '../../context/contextMenu';
    import { SpecialKeysContext } from '../../context/specialKeysContext';

    export let terminalId: string
    export let setContextMenuProps: (p: CommonContextMenuProps<TerminalMenuPage> & { currentTerminal: TerminalProps } | null) => void

    let showControls = false
    let positionHover: TerminalHoverDimensions | null = null
    let terminalElmt: HTMLElement | null = null
    let terminalContainerElmt: HTMLElement | null = null
    $: shellsCtx = $ShellsCtx
    $: terminalsCtx = $TerminalsCtx
    $: specialKeysCtx = $SpecialKeysContext
    $: terminalDimensionsCtx = $TerminalDimensionsCtx
    $: tDimensions = terminalDimensionsCtx[term.treeId].terminals[terminalId]
    $: isCurrentTree = terminalsCtx.currentTreeId === terminalsCtx.terminals[terminalId].treeId
    $: isCurrentTerm = terminalsCtx.currentTerminal === parseInt(terminalId)
    $: isDragging = terminalsCtx.draggingTerminalId === parseInt(terminalId) && terminalsCtx.isDragging
    $: term = terminalsCtx.terminals[terminalId]

    const observer = new MutationObserver(() => {
        if(terminalContainerElmt?.style.display !== 'none') {
            term.terminal.focus()
            term.fitAddon.fit()
        }
    })

    const handleContextMenu = (e: MouseEvent & { currentTarget: EventTarget & HTMLElement }) => {
        setContextMenuProps({
            terminalId: parseInt(terminalId),
            x: e.clientX,
            y: e.clientY,
            currentTerminal: terminalsCtx.terminals[terminalId]
        })
    }

    onMount(() => {
        observer.observe(terminalContainerElmt!, {
            attributes: true,
            attributeFilter: ['style'],
        })

        term.terminal.open(terminalElmt!)
        term.fitAddon.fit()
        term.terminal.focus()

        const textarea = term.terminal.textarea
        if(textarea) {
            textarea.setAttribute('id', `terminal${terminalId}`)
            textarea.addEventListener('focus', () => {
                if(terminalsCtx.currentTerminal.toString() !== terminalId) {
                    TerminalsCtx.setCurrentTerminal(terminalId)
                }
            })
        }
    })

    onDestroy(() => observer.disconnect())
</script>

<main
    on:mouseenter={() => showControls = true}
    on:mouseleave={() => showControls = false}
    bind:this={terminalContainerElmt}
    style="{isDragging ? 'border: solid 1px blue;' : ''} {isCurrentTree ? '' : 'display: none;'}{tDimensions ? `height: ${tDimensions.height}%; width: ${tDimensions.width}%; top: ${tDimensions.y}%; left: ${tDimensions.x}%` : ''}"
>
    {#if showControls}
        <div class="controls" style="color: {lightOrDark(defaultBgc(shellsCtx.s)) ? 'black' : 'white'};">
            {#if terminalsInTree(terminalsCtx.trees[term.treeId].tree) > 1}
                <div title="moves the terminal to another tab" on:click={() => TerminalsCtx.removeTerminalFromTree(terminalId)}>
                    <RemoveFromTreeIcon />
                </div>
            {/if}
            <div
                style="{term.tabColor ? `background-color: ${term.tabColor};` : ''} color: {lightOrDark(term.tabColor) ? 'black' : 'white'}"
                on:click={() => TerminalsCtx.removeTerminal(terminalId)}
            >
                <XIcon />
            </div>
        </div>
    {/if}
    
    <div
        class="terminalContainer"
        style="{(specialKeysCtx.ctrlAltPressed && isCurrentTerm) ? 'border: solid 1px green;' : ''}"
        bind:this={terminalElmt}
        use:dropzoneTerminalPosition={{
            draggingTerminalId: terminalsCtx.draggingTerminalId,
            draggingTerminalTreeId: terminalsCtx.terminals[terminalsCtx.draggingTerminalId]?.treeId || -1,
            setPositionHover: (newValue) => positionHover = newValue,
            currentTreeId: term.treeId,
            currentTerminalId: parseInt(terminalId),
        }}
        on:contextmenu|preventDefault={handleContextMenu}
    >
        {#if positionHover}
            <div
                class="positionHover"
                style="left: {positionHover.x}%; top: {positionHover.y}%; height: {positionHover.height}%; width: {positionHover.width}%"
            ></div>
        {/if}
    </div>
</main>

<style>
    main {
        position: absolute;
        display: flex;
        gap: 5px;
        padding: 5px;
        flex-direction: column;
    }
    .controls {
        position: absolute;
        z-index: 101;
        right: 5px;
        top: 5px;
        display: flex;
        gap: 5px;
        background-color: var(--color-primary);
        border-radius: 5px;
    }
    .controls > * {
        border-radius: 5px;
        padding: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
    }
    .controls > *:hover {
        background-color: var(--color-margin);
    }
    .terminalContainer {
        width: 100%;
        height: 100%;
    }
    .positionHover {
        position: absolute;
        background-color: rgba(255,255,255, 0.2);
        left: 0;
        top: 0;
        height: 100%;
        width: 50%;
        z-index: 100;
    }
    :global(.xterm-viewport) {
        scrollbar-color: var(--color-margin) var(--color-primary);
        overflow-y: auto !important;
    }
</style>
