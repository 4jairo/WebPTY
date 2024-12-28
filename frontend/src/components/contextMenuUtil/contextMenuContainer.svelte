<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->

<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    export let closeMenu: () => void
    export let menuPage: any
    export let x: number
    export let y: number
    
    const fitMenu = () => {
        if(!menuElmt) return

        const { offsetHeight, offsetWidth } = menuElmt
        if(offsetWidth + x > window.innerWidth) x -= offsetWidth
        if(offsetHeight + y > window.innerHeight) y -= offsetHeight
    }

    let menuElmt: HTMLElement | null = null

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
        <slot />
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
</style>