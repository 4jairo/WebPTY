import BashIcon from "../icons/bashIcon.svelte";
import CmdIcon from "../icons/cmdIcon.svelte";
import PowershellIcon from "../icons/powershellIcon.svelte";

export const getShellIcon = (shell: string) => {
    switch (shell) {
        case 'cmd.exe':
            return CmdIcon
        case 'pwsh.exe':
        case 'powershell.exe':
            return PowershellIcon
        case 'wsl.exe':
            return BashIcon
        default:
            return BashIcon
    }
}