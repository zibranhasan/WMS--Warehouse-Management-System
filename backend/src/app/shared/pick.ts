const pick = <T extends Record<string, unknown>, k extends keyof T>(
    obj: T,
    keys: k[],
): Partial<Record<k, T[k]>> => {
    const finalObj: Partial<Record<k, T[k]>> = {};

    for (const key of keys) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
            finalObj[key] = obj[key] as T[k];
        }
    }

    return finalObj;
};

export default pick;
