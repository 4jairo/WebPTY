<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->

<script lang="ts">
    import type { Component } from "svelte";

    export let txt: string
    export let icon: Component | undefined = undefined
    export let fn: (e: MouseEvent & {currentTarget: EventTarget & HTMLElement}) => void = () => {}
    export let separation: boolean = false
    export let disabled: boolean = false
    export let center: boolean = false
</script>

<section on:click={fn} class={disabled ? 'disabled' : ''}>
    {#if icon}
        <svelte:component this={icon}/>
    {/if}
    <p style="{icon ? '' : 'width: 100%;'} {center ? 'text-align: center;' : ''}">{txt}</p>
</section>

{#if separation}
    <div class="separation"></div>
{/if}

<style>
    section {
        display: flex;
        align-items: center;
        padding: 5px;
        gap: 10px;
        border-radius: 5px;
    }
    .disabled {
        opacity: 0.7;
    }
    section:not(.disabled):hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
    section p {
        white-space: nowrap;
    }
   
    .separation {
        margin: 5px 0;
        height: 1px;
        border-bottom: solid 1px var(--color-margin);
    }
</style>