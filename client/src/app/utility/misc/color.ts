export function getRgbObject(raw: string): any{
    if(!raw){
        return {
            r: 0,
            g: 0,
            b: 0
        }
    }
    const matches = raw.match(/rgb\((\d+), ?(\d+), ?(\d+)\)/)
    return {
        r: Number(matches[1]),
        g: Number(matches[2]),
        b: Number(matches[3])
    }
}
