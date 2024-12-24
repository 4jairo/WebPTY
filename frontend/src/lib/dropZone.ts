type dropZoneInnerParams<T> = {
    node: HTMLElement, 
    onEnter?: (e: DragEvent) => void, 
    onLeave?: (e: DragEvent) => void,
    onDrop?: (e: DragEvent) => void,
    onDestroy?: () => void,
    onDrag?: (e: DragEvent) => void,
    onUpdate?: (newValue: T) => void
}

export const dropZoneInner = <T>({ node, onDestroy, onDrag, onDrop, onEnter, onLeave, onUpdate }: dropZoneInnerParams<T>) => {
    let draggingOver = false;

    const onDragEnter = (e: DragEvent) => {
        e.preventDefault()

        if(!draggingOver) {
            if(onEnter) onEnter(e)
            draggingOver = true;
        }
    }

    const onDragLeave = (e: DragEvent) => {
        if(!node.contains(e.relatedTarget as Node)) {
            draggingOver = false;
            if(onLeave) onLeave(e)
        }
    }

    const onDragOver = (e: DragEvent) => {
        e.preventDefault()
        e.dataTransfer!.dropEffect = 'move'

        if(draggingOver && onDrag) {
            onDrag(e)
        }  
    }

    const onDropNode = (e: DragEvent) => {
        e.preventDefault()
        if(onDrop) onDrop(e)
    }

    node.addEventListener('dragenter', onDragEnter)
    node.addEventListener('dragleave', onDragLeave)
    node.addEventListener('dragover', onDragOver)
    node.addEventListener('drop', onDropNode)

    return {
        update: (newValue: T) => {
            if (onUpdate) onUpdate(newValue);
        },
        destroy: () => {
            node.removeEventListener('dragenter', onDragEnter)
            node.removeEventListener('dragleave', onDragLeave)
            node.removeEventListener('dragover', onDragOver)
            node.removeEventListener('drop', onDropNode)
            if(onDestroy) onDestroy()
        }
    }
}
