/*
 * implementation gotten from https://stackoverflow.com/questions/69843406/flattening-a-nested-object-in-typescript-whilst-preserving-types
 * from user https://stackoverflow.com/users/2887218/jcalz
 * comment: https://stackoverflow.com/questions/69843406/flattening-a-nested-object-in-typescript-whilst-preserving-types#comment123459995_69843406
 * TypeScript Playground https://www.typescriptlang.org/play?#code/MYewdgzgLgBGCm14BMYF4YG8CwAoGMAhgFxZ4EEBGpO+FBwN59FyAjKQEQAW8ANnxCcANMxYxkAJlIAWSaLr0AvguWqYKvEoDcePMnjA+hAE7wYAMwCuYYFACW4S8ahR4YADwAVGPAAebmDIEDAglABWhlAAfAAUCEjIpF4AlKQAYi6B3tG6uHigkLAWWe4o6M6Eru7xiG7IKXkA9ABUMIXQldUISWSKRJTA7KTQJvZgAOZ59ISDUqRgVgC2lPAmeUowLU16+bhQAJ4ADuaZVdk+-oHBoRFR0RVhkXa+Ae43PgD8t8+wTHQAbQA0jBxjAANbwA4gCwwLwAXQAtJ9SLE-KQAHLgDFWASzPjwbzA+EPK7vELjCxrGAANRg3zpZKCISeUXpYlpr2uITMhGQ4D4ByIYAOAPh9JgAAV7MBwd5hDAgQ8MqVPDTSW9maCwFSTDB0nTvrFaOIAZLtRCoTD9XTCCEAAYAEkwAFEAiZCHYPECFaNxhMYAAfODLVYmaJKAB0zrdUA9Xslvrj-qDIZWawj9vhxA5BANZvFShSMAW8AAbtTSNLZfLFcq4OW1sxi2gHmWQPZUJsmTcAEqGEAmZAeSHQ2FeBWxA6kSnUgDyLbbHeQD0+zDnXPJ2t1MAAqhLMDBgRbR9a59mYHPiRoSw2K3rS-fdh1YAB9ewQHECCqxMuEPhWPApCECKi59AQBKwGYIQYH+AHmGgiEht+gbBjYBgWOM5TfIs36kHBgHTDAZhQFYJhgMRiBaHkeDWLYDhOHGIEQBYg5LAAIlUhDeJuWqsnYcRPMkaT6qqOR5HRdiOBRTGQKxJgcVxsRCcKBwKhYVS8CYGKEEsQEwH6kypos6YmCJIEHLRNhSYxHpyWxnFQIQykRMBIrqZpaw6XpKIGcmRnBiZYbmSK4EwJBDYAO5zhEFSYDozDyTAsQRaOFpPMWJoUKljwRACo7wkRBD2LCsSHCc1rgugSEAOT8VANUwAAZE1MAAIQAIImB6ByRh+XU9bE4LFi1ELtUhuF8JluaXncdiRnaED2BMYC1NFEQKrJLEOUp4IKqOKQpBy3Z8BA5hZfQMW-AtEBLSta1XQqh4AhpUBad55jfK9726eYADUlpCqQBWkO+n64nwQ3FkWx3MEozAkWRFEIOt4QbHgQA
 */

type Flatten<T extends object> = object extends T
    ? object
    : {
          [K in keyof T]-?: (
              x: NonNullable<T[K]> extends infer V
                  ? V extends object
                      ? V extends readonly any[]
                          ? Pick<T, K>
                          : Flatten<V> extends infer FV
                          ? {
                                [P in keyof FV as `${Extract<
                                    K,
                                    string | number
                                >}.${Extract<P, string | number>}`]: FV[P];
                            }
                          : never
                      : Pick<T, K>
                  : never
          ) => void;
      } extends Record<keyof T, (y: infer O) => void>
    ? O extends infer _U
        ? { [K in keyof O]: O[K] }
        : never
    : never;

const isNull = (value: any) => {
    let res = value === null || undefined ? null : value;
    return res;
};

export function flatten<T extends object>(obj: T): Flatten<T>;
export function flatten(obj: any, fatherName: string | number): any;
export function flatten(obj: any, fatherName?: string | number): any {
    let newObj = {};
    for (let key in obj) {
        let k = obj[key];
        if (typeof k === 'object' && !Array.isArray(k) && k !== null) {
            Object.assign(newObj, flatten(k, key));
        } else {
            Object.assign(newObj, {
                [fatherName ? fatherName + '.' + key : key]: isNull(k),
            });
        }
    }
    return newObj;
}
