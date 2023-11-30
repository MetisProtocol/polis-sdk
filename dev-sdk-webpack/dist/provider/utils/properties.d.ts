export declare function defineReadOnly<T, K extends keyof T>(object: T, name: K, value: T[K]): void;
export declare function getStatic<T>(ctor: any, key: string): T | null;
export declare function checkNew(target: any, kind: any): void;
