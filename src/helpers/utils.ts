
export async function setTimeoutPromise(action: () => Promise<any>, ms: number): Promise<any> {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                resolve(await action());
            } catch (e) {
                reject(e);
            }
        }, ms);
    });
}