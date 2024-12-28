<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_autofocus -->

<script lang="ts">
    import RenameIcon from "../../icons/renameIcon.svelte";
    import XIcon from "../../icons/xIcon.svelte";
    import { TerminalsCtx } from "../../context/terminalsContext";
    import ColorPalleteIcon from "../../icons/colorPalleteIcon.svelte";
    import { TabMenuPage, type MenuOptions } from "../../context/contextMenu";
    import MenuOption from "../contextMenuUtil/menuOption.svelte";
    import ArrowLeftIcon from "../../icons/arrowLeftIcon.svelte";
    import TickIcon from "../../icons/tickIcon.svelte";
    import DuplicateIcon from "../../icons/duplicateIcon.svelte";
    import { createConnection } from "../../lib/createConnection";
    import { ShellsCtx } from "../../context/shellsContext";
    import AddIcon from "../../icons/addIcon.svelte";
    import { getShellIcon } from "../../lib/getShellIcon";
    import BashIcon from "../../icons/bashIcon.svelte";
    import ContextMenuContainer from "../contextMenuUtil/contextMenuContainer.svelte";

    export let x: number
    export let y: number
    export let terminalId: number
    export let clickOnTab: boolean
    export let closeMenu: () => void
    export let menuPage: TabMenuPage = TabMenuPage.Home

    $: terminalsCtx = $TerminalsCtx
    $: shellsCtx = $ShellsCtx

    $: currentTerminal = terminalsCtx.terminals[terminalId]
    $: currentTree = terminalsCtx.trees[currentTerminal?.treeId || -1]

    const tabDependent: MenuOptions[] = clickOnTab ? [
        { 
            txt: 'Rename', 
            icon: RenameIcon,
            fn: () => menuPage = TabMenuPage.Rename
        },
        {
            txt: 'Change colors',
            icon: ColorPalleteIcon,
            fn: () => menuPage = TabMenuPage.ChangeColors,
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
            fn: () => menuPage = TabMenuPage.NewTab,
            icon: AddIcon,
            separation: true
        },
        ...tabDependent
    ]

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

</script>

<ContextMenuContainer {x} {y} {closeMenu} {menuPage}>
    {#if menuPage === TabMenuPage.Home}
        {#each menuOptions as options, i}
            <MenuOption {...options} separation={options.separation && i !== menuOptions.length -1}/>
        {/each}

    {:else if menuPage === TabMenuPage.Rename}
        <MenuOption txt="Rename tab" disabled separation center />
        <MenuOption fn={() => menuPage = TabMenuPage.Home} txt="Back" separation icon={ArrowLeftIcon}/>

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

    {:else if menuPage === TabMenuPage.ChangeColors}
        <MenuOption txt="Change colors" disabled separation center />
        <MenuOption fn={() => menuPage = TabMenuPage.Home} txt="Back" separation icon={ArrowLeftIcon}/>

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

    {:else if menuPage === TabMenuPage.NewTab}
        <MenuOption txt="New Tab" disabled separation center />
        <MenuOption fn={() => menuPage = TabMenuPage.Home} txt="Back" separation icon={ArrowLeftIcon}/>
        
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
</ContextMenuContainer>


<style>
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