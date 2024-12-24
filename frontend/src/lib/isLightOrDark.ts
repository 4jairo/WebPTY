export const lightOrDark = (hex: string) => {
    const value = hex.replace('#', '')
    const rgb = value.length === 3
        ? value.split('').map(c => parseInt(c.repeat(2), 16))
        : value.match(/.{1,2}/g)?.map(v => parseInt(v, 16))

    if(!rgb || rgb.some((n) => isNaN(n))) {
        return false
    }

    const [r, g, b] = rgb
    return ((r * 299) + (g * 587) + (b * 144)) / 1000 > 130
}