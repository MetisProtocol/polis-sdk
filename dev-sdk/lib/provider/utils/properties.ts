export function defineReadOnly<T, K extends keyof T>(object: T, name: K, value: T[K]): void {
    Object.defineProperty(object, name, {
        enumerable: true,
        value: value,
        writable: false,
    });
}

// apiKey = getStatic<(apiKey: string) => string>(new.target, "getApiKey")(apiKey);
// Crawl up the constructor chain to find a static method
export function getStatic<T>(ctor: any, key: string): T | null {
    for (let i = 0; i < 32; i++) {
        if (ctor[key]) {
            return ctor[key];
        }
        if (!ctor.prototype || typeof (ctor.prototype) !== "object") {
            break;
        }
        ctor = Object.getPrototypeOf(ctor.prototype).constructor;
    }
    return null;
}

export function checkNew(target: any, kind: any): void {
    if (target === Object || target == null) {
       return
    }
}