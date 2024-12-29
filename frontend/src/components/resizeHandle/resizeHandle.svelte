<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->

<script lang="ts">
    import { TerminalsCtx } from "../../context/terminalsContext";
    import type { TerminalHoverDimensions } from "../../lib/dndTerminalPosition";
    import { dropzoneResizeHandle } from "../../lib/dndTerminalPositionResizeHandle";
    import { findIdOnTree, updateTerminalPercent } from "../../lib/terminalsContextUtil";

    export let position: TerminalHoverDimensions
    export let currentId: number
    $: terminalsCtx = $TerminalsCtx

    let showPositionHover = false
    let resizeOffset = 0
    $: width = position.width === 0 ? '1px' : `${position.width}%`
    $: height = position.height === 0 ? '1px' : `${position.height}%`
    $: top = (resizeOffset && position.height === 0) ? position.y - resizeOffset : position.y
    $: left = (resizeOffset && position.width === 0) ? position.x - resizeOffset : position.x

    $: classList = position.width === 0 ? 'wide' : 'large'

    const handleMousedown = (e: MouseEvent & {currentTarget: EventTarget & HTMLElement}) => {
        window.onmouseup = () => {
            TerminalsCtx.update((prev) => {
                const term = findIdOnTree(terminalsCtx.trees[terminalsCtx.currentTreeId].tree, currentId)!
                updateTerminalPercent(term.tree.terminals, currentId, resizeOffset)
                return prev
            })
            
            resizeOffset = 0
            window.onmouseup = null
            window.onmousemove = null
        }

        window.onmousemove = (event) => {
            const { clientX, clientY } = event
            if(clientX > window.innerWidth || clientX < 0 || clientY > window.innerHeight || clientY < 0) {
                return
            }

            resizeOffset = position.width === 0
                ? (e.clientX - clientX) / window.innerWidth * 100
                : (e.clientY - clientY) / window.innerHeight * 100
        }
    }
</script>

<main
    use:dropzoneResizeHandle={{
        currentId,
        currentTreeId: terminalsCtx.currentTreeId,
        setPositionHover: (show) => showPositionHover = show,
        draggingTerminalId: terminalsCtx.draggingTerminalId,
        draggingTerminalTreeId: terminalsCtx.terminals[terminalsCtx.draggingTerminalId]?.treeId || -1
    }}
    on:mousedown|preventDefault={handleMousedown}
    style="left: {left}%; top: {top}%; width: {width}; height: {height};"
    class="{classList} {resizeOffset ? 'mousePressed' : ''} {showPositionHover ? 'positionHover' : ''}"
>
</main>

<style>
    main {
        position: absolute;
        z-index: 101;
        background-color: var(--color-primary);
    }
    .wide.positionHover {
        transform: translateX(-10px);
        width: 20px !important;
        background-color: rgba(255,255,255, 0.2);
    }
    .large.positionHover {
        transform: translateY(-10px);
        height: 20px !important;
        background-color: rgba(255,255,255, 0.2);
    }

    .wide:hover, .wide.mousePressed {
        transform: translateX(-3px);
        width: 6px !important;
    }
    .large:hover, .large.mousePressed {
        transform: translateY(-3px);
        height: 6px !important;
    }

    .wide {
        cursor: e-resize;
    }
    .large {
        cursor: n-resize;
    }
</style>