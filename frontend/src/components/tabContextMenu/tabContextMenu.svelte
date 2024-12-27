<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_autofocus -->

<script lang="ts">
    import { onDestroy, onMount, type Component } from "svelte";
    import RenameIcon from "../../icons/renameIcon.svelte";
    import XIcon from "../../icons/xIcon.svelte";
    import { TerminalsCtx } from "../../context/terminalsContext";
    import ColorPalleteIcon from "../../icons/colorPalleteIcon.svelte";
    import { MenuPage } from "../../context/tabContextMenu";
    import MenuOption from "./menuOption.svelte";
    import ArrowLeftIcon from "../../icons/arrowLeftIcon.svelte";
    import TickIcon from "../../icons/tickIcon.svelte";
    import DuplicateIcon from "../../icons/duplicateIcon.svelte";
    import { createConnection } from "../../lib/createConnection";
    import { ShellsCtx } from "../../context/shellsContext";
    import AddIcon from "../../icons/addIcon.svelte";
    import { getShellIcon } from "../../lib/getShellIcon";
    import BashIcon from "../../icons/bashIcon.svelte";
    import TreeIcon from "../../icons/treeIcon.svelte";
    import Terminal from "../terminal/terminal.svelte";

    export let x: number
    export let y: number
    export let terminalId: number
    export let clickOnTab: boolean
    export let closeMenu: () => void
    export let menuPage: MenuPage = MenuPage.Home

    let menuElmt: HTMLElement | null = null
    $: terminalsCtx = $TerminalsCtx
    $: shellsCtx = $ShellsCtx

    $: currentTerminal = terminalsCtx.terminals[terminalId]
    $: currentTree = terminalsCtx.trees[currentTerminal?.treeId || -1]

    type MenuOptions = {
        txt: string,
        icon: Component,
        fn: (e: MouseEvent & {currentTarget: EventTarget & HTMLElement}) => void,
        separation?: boolean
    }

    const tabDependent: MenuOptions[] = clickOnTab ? [
        { 
            txt: 'Rename', 
            icon: RenameIcon,
            fn: () => menuPage = MenuPage.Rename
        },
        {
            txt: 'Change colors',
            icon: ColorPalleteIcon,
            fn: () => menuPage = MenuPage.ChangeColors,
        },
        {
            txt: 'Duplicate tab',
            icon: DuplicateIcon,
            fn: () => {
                const { customName: terminalCustomName, shell, tabColor } = currentTerminal
                const { customName: treeCustomName, treeColor } = currentTree
                createConnection(shell, terminalCustomName, tabColor, treeCustomName, treeColor).then(closeMenu)
            },
            separation: true
        },
        {
            txt: 'Remove tab',
            icon: XIcon, 
            fn: () => {
                TerminalsCtx.removeTerminal(terminalId)
                closeMenu()
            }, 
        },

    ] : []

    const menuOptions: MenuOptions[] = [
        {
            txt: 'New tab',
            fn: () => menuPage = MenuPage.NewTab,
            icon: AddIcon,
            separation: true
        },
        ...tabDependent
    ]

    const fitMenu = () => {
        if(!menuElmt) return

        const { offsetHeight, offsetWidth } = menuElmt
        if(offsetWidth + x > window.innerWidth) x -= offsetWidth
        if(offsetHeight + y > window.innerHeight) y -= offsetHeight
    }

    const handleChangeCustomName = (e: SubmitEvent & {currentTarget: EventTarget & HTMLFormElement}, isTree: boolean) => {
        if(isTree) {
            TerminalsCtx.setTreeCustomName(terminalId, e.currentTarget.treeName.value)
        } else {
            TerminalsCtx.setTabCustomName(terminalId, e.currentTarget.tabName.value)
        }
        closeMenu()
    }

    const handleChangeColors = (e: SubmitEvent & {currentTarget: EventTarget & HTMLFormElement}, isTree: boolean) => {
        if(isTree) {
            TerminalsCtx.setTreeColor(currentTerminal.treeId, e.currentTarget.treeColor.value)
        } else {
            TerminalsCtx.setTabColor(terminalId, e.currentTarget.tabColor.value)
        }
        closeMenu()
    }

    const handleCreateNewTab = (e: SubmitEvent & {currentTarget: EventTarget & HTMLFormElement}) => {
        createConnection(e.currentTarget.customShell.value).then(closeMenu)
    }
   
    onMount(() => {
        window.addEventListener('resize', fitMenu)
        fitMenu()
    })

    onDestroy(() => {
        window.removeEventListener('resize', fitMenu)
    })

    $: {
        menuPage;
        fitMenu()
    }
</script>

<main on:click={closeMenu} on:contextmenu|preventDefault>
    <div bind:this={menuElmt} class="container" style="left: {x}px; top: {y}px" on:click|stopPropagation>
        {#if menuPage === MenuPage.Home}
            {#each menuOptions as options, i}
                <MenuOption {...options} isLast={i === menuOptions.length -1}/>
            {/each}

        {:else if menuPage === MenuPage.Rename}
            <MenuOption txt="Rename tab" disabled separation center />
            <MenuOption fn={() => menuPage = MenuPage.Home} txt="Back" separation icon={ArrowLeftIcon}/>

            <MenuOption txt="Tab name" disabled />
            <form on:submit|preventDefault={(e) => handleChangeCustomName(e, false)}>
                <input type="text" name="tabName" value={currentTerminal.customName}/>
                <button>
                    <TickIcon />
                </button>
            </form>

            <MenuOption txt="Tree name" disabled />
            <form on:submit|preventDefault={(e) => handleChangeCustomName(e, true)}>
                <input type="text" name="treeName" value={currentTree.customName}/>
                <button>
                    <TickIcon />
                </button>
            </form>

        {:else if menuPage === MenuPage.ChangeColors}
            <MenuOption txt="Change colors" disabled separation center />
            <MenuOption fn={() => menuPage = MenuPage.Home} txt="Back" separation icon={ArrowLeftIcon}/>

            <MenuOption txt="Tab color" disabled />
            <form on:submit|preventDefault={(e) => handleChangeColors(e, false)}>
                <input class="customColorInput" type="color" name="tabColor" value={currentTerminal.tabColor}/>
                <button>
                    <TickIcon />
                </button>
            </form>

            <MenuOption txt="Tree color" disabled />
            <form on:submit|preventDefault={(e) => handleChangeColors(e, true)}>
                <input class="customColorInput" type="color" name="treeColor" value={currentTree.treeColor}/>
                <button>
                    <TickIcon />
                </button>
            </form>

        {:else if menuPage === MenuPage.NewTab}
            <MenuOption txt="New Tab" disabled separation center />
            <MenuOption fn={() => menuPage = MenuPage.Home} txt="Back" separation icon={ArrowLeftIcon}/>
            
            {#each shellsCtx.s?.shells || [] as shell, i}
                <MenuOption 
                    fn={() => createConnection(shell).then(closeMenu)} 
                    txt="{shell} {shellsCtx.s!.defaultShell === i ? '(default)': ''}" 
                    separation={i +1 === shellsCtx.s?.shells.length} 
                    icon={getShellIcon(shell)}
                />
            {/each}
        
            <MenuOption disabled icon={BashIcon} txt="Custom:"/> 
            <form on:submit|preventDefault={handleCreateNewTab}>
                <input type="text" name="customShell" placeholder="/bin/sh"/>
                <button>
                    <TickIcon />
                </button>
            </form>
        {/if}
    </div>
</main>


<style>
    main {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: 300;
        background-color: rgba(0, 0, 0, 0.2);
    }
    .container {
        color: white;
        z-index: 301;
        user-select: none;
        position: absolute;
        background-color: var(--color-primary);
        border-radius: 5px;
        padding: 5px;
        border: solid 1px var(--color-margin);
    }

    form {
        display: flex;
        gap: 5px;
    }
    form > * {
        all: unset;
        background-color: var(--color-primary);
        border: solid 1px var(--color-margin);
        border-radius: 5px;
        padding: 5px;
    }
    form input {
        width: 200px;
    }
    form button {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    form input:focus, form input:hover, form button:hover {
        background-color: rgba(255, 255,255, 0.2);
    }
    .customColorInput {
        padding: 0
    }
</style>