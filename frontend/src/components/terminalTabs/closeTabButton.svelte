<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->

<script lang="ts">
    import { TerminalsCtx } from "../../context/terminalsContext";
    import XIcon from "../../icons/xIcon.svelte";

    export let tabColor: string
    export let fontColor: string
    export let terminalId: number
</script>

<div
    style="{tabColor ? `background-color: ${tabColor};` : ''} color: {fontColor};"
    on:click={() => TerminalsCtx.removeTerminal(terminalId)}
    on:mousedown|stopPropagation
>
    <XIcon />
</div>

<style>
    div {
        position: absolute;
        top: 20%;
        right: 5px;
        height: 60%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 3px;
        border-radius: 3px;
        cursor: pointer;
    }
    div:hover {
        background-color: var(--color-primary);
    }
</style>