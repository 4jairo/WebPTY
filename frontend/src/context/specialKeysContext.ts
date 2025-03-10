import { writable } from "svelte/store";

export const SpecialKeysContext = writable({
    ctrlAltPressed: false
})