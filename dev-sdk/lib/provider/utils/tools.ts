
export function sleep(time:number) {
    return new Promise((resolve) => {
        setInterval(resolve, time);
    });
}