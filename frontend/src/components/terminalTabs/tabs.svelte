<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->

<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { createConnection } from "../../lib/createConnection";
    import { defaultBgc, ShellsCtx } from "../../context/shellsContext";
    import { TerminalsCtx } from "../../context/terminalsContext";
    import AddIcon from "../../icons/addIcon.svelte";
    import TabContextMenu from "../tabContextMenu/tabContextMenu.svelte";
    import { dropzoneTabOrder } from "../../lib/dndTabOrder";
    import { getShellIcon } from "../../lib/getShellIcon";
    import { TabMenuPage, type CommonContextMenuProps } from "../../context/contextMenu";
    import { lightOrDark } from "../../lib/isLightOrDark";
    import SplitIcon from "../../icons/splitIcon.svelte";
    import JoinIcon from "../../icons/joinIcon.svelte";
    import LoadingIcon from "../../icons/loadingIcon.svelte";
    import CloseTabButton from "./closeTabButton.svelte";

    let groupByTree = false
    let tabWidth = 200
    let draggingHoverPosition: number | null = null
    let mainContainer: HTMLElement | null = null
    let contextMenuProps: CommonContextMenuProps<TabMenuPage> & { clickOnTab: boolean } | null = null

    $: shellsCtx = $ShellsCtx
    $: terminalsCtx = $TerminalsCtx

    const handleClickTab = (e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }, terminalId: number) => {
        if (e.button === 0) { 
            //left button 
            TerminalsCtx.setDraggingTerminal(terminalId)
        }
        else if (e.button === 1) {
            // middle button
            TerminalsCtx.removeTerminal(terminalId)  
        }
    }

    const handleContextMenuOnTab = (e: MouseEvent & { currentTarget: EventTarget & HTMLElement }, terminalId: number) => {
        contextMenuProps = {
            terminalId,
            x: e.clientX,
            y: e.clientY,
            clickOnTab: true
        }
    }

    const handleContextMenuOnMenu = (e: MouseEvent & { currentTarget: EventTarget & HTMLElement }) => {
        contextMenuProps = {
            x: e.clientX,
            y: e.clientY,
            terminalId: -1,
            clickOnTab: false
        }
    }

    const isBesideCurrent = (i: number) => {
        if(terminalsCtx.order.length -1 === i) {
            return false
        }
        return terminalsCtx.order[i +1] === terminalsCtx.currentTerminal
    }

    const getTabStyle = (current: boolean, tabColor: string, fontColor: string, terminalId: number) => {
        let padding = 'padding: 7px 40px 7px 10px;'
        if(tabWidth < 60) {
            padding = `padding: 0; justify-content: center;`
        } else if (tabWidth < 135) {
            padding = `padding: 7px 10px 7px 10px;`
        }

        
        const treeColor = terminalsCtx.trees[terminalsCtx.terminals[terminalId]?.treeId]?.treeColor
        const borderTop = treeColor ? `border-top: solid 1px ${treeColor};` : ''

        const bgc = current
            ? `background-color: ${tabColor || defaultBgc(shellsCtx.s)};`
            : ''

        return padding + bgc + borderTop +
            `color: ${current ? fontColor : 'white'};` +
            `width: ${tabWidth}px;`
    }

    const setTabSize = () => {
        if(!mainContainer) return

        const { width: addBtnWidth } = mainContainer.querySelector('section')!.getBoundingClientRect()
        tabWidth = Math.min((window.innerWidth - addBtnWidth * 2) / terminalsCtx.order.length, 200)
    }

    const closeContextMenu = () => {
        contextMenuProps = null
        if(terminalsCtx.terminals[terminalsCtx.currentTerminal]) {
            terminalsCtx.terminals[terminalsCtx.currentTerminal].terminal.focus()
        }
    }

    const newTab = () => {
        if(shellsCtx.s) {
            createConnection(shellsCtx.s.shells[shellsCtx.s.defaultShell])
        } else {
            contextMenuProps = {
                clickOnTab: false,
                terminalId: -1,
                x: 10,
                y: 10,
                menuPage: TabMenuPage.NewTab
            }
        }
    }

    const groupByTreeFilter = (order: number[]) => {
        if(!groupByTree) {
            return order
        }
        
        const filtered: { [terminal: number]: boolean } = {}        
        return order.filter((terminal) => {
            const { treeId } = terminalsCtx.terminals[terminal]
            if(filtered[treeId]) {
                return false
            }
            filtered[treeId] = true
            return true
        })
    }

    onMount(() => {
        window.addEventListener('resize', setTabSize)
        setTabSize()
    })

    onDestroy(() => {
        window.removeEventListener('resize', setTabSize)
    })

    $: {
        terminalsCtx.terminals;
        setTabSize()
    }

    $: if(!shellsCtx.fetching && terminalsCtx.order.length === 0) {
        newTab()
    }
</script>

<main
    bind:this={mainContainer}
    use:dropzoneTabOrder={{ 
        currentTerminal: terminalsCtx.currentTerminal,
        tabWidth,
        tabsOrder: terminalsCtx.order,
        draggingTerminalIdx: terminalsCtx.draggingTerminalId,
        setDraggingHoverPosition: (n) => draggingHoverPosition = n
    }}
    on:contextmenu|preventDefault={handleContextMenuOnMenu}
>
    {#each groupByTreeFilter(terminalsCtx.order) as terminalId, i}     
        {@const { shell, customName, tabColor, treeId } = terminalsCtx.terminals[terminalId]}
        {@const customTreeName = terminalsCtx.trees[treeId].customName}
        {@const fontColor = lightOrDark(tabColor) ? 'black' : 'white'}
        {@const current = groupByTree 
            ? terminalsCtx.currentTreeId === terminalsCtx.terminals[terminalId].treeId
            : terminalsCtx.currentTerminal === terminalId
        }

        <label for="terminal{terminalId}">
            <div 
                class="tab {isBesideCurrent(i) ? 'noSeparator' : ''} {current ? 'current noSeparator' : ''}"
                style={getTabStyle(current, tabColor, fontColor, terminalId)}
                draggable="true"
                on:mousedown={(e) => handleClickTab(e, terminalId)}
                on:dragstart={() => TerminalsCtx.setIsDragging(true)}
                on:dragend={() => TerminalsCtx.setIsDragging(false)}
                on:contextmenu|preventDefault|stopPropagation={(e) => handleContextMenuOnTab(e, terminalId)}
            >
                <svelte:component this={getShellIcon(shell)}/>
    
                {#if tabWidth > 135}
                    <p>{groupByTree 
                        ? customTreeName || `tree ${treeId}`
                        : customName || shell
                    }</p>
                {/if}
    
                {#if tabWidth > 60}
                    <CloseTabButton {fontColor} {tabColor} {terminalId} />
                {/if}
            </div>
        </label>
    {/each}

    {#if shellsCtx.fetching}
        <div class="tab current" style={getTabStyle(true, '', '', -1)}>
            <LoadingIcon />
        </div>
    {/if}

    <section class="tab noX" on:click={newTab}>
        <AddIcon />
    </section>

    <section 
        on:click={() => groupByTree = !groupByTree}
        class="tab noSeparator noX" 
        title="group/split terminals on the same tab"
    >
        {#if groupByTree}
            <SplitIcon />
        {:else}
            <JoinIcon />
        {/if}
    </section>

    {#if draggingHoverPosition !== null}
        <div
            class="draggingHoverPosition"
            style="left: {draggingHoverPosition}px"
        ></div>
    {/if}
</main>

{#if contextMenuProps}
    <TabContextMenu {...contextMenuProps} closeMenu={closeContextMenu}/>
{/if}

<style>
    main {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        display: flex;
        background-color: var(--color-primary);
        position: relative;
    }
    label {
        display: flex;
    }
    .tab {
        user-select: none;
        overflow: hidden;
        color: white;
        border-radius: 5px 5px 0 0;
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 200;
    }
    .tab p {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis
    }
    .tab.noX {
        padding: 5px 10px;
    }

    .tab:not(.noSeparator)::before {
        content: "";
        position: absolute;
        width: 1px;
        top: 20%;
        right: 0;
        height: 60%;
        background-color: var(--color-margin)
    }
    .tab:not(.noSeparator):hover::before {
        width: 0;
    }

    .tab:not(.current):hover {
        background-color: rgba(0, 0, 0, 0.5);
    }

    .draggingHoverPosition {
        position: absolute;
        width: 4px;
        height: 100%;
        background-color: white;
        top: 0;
        z-index: 201;
    }
</style>