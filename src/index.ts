interface MatchInterface<
  CasesObj extends { [key: string]: (...args: any) => any }
> {
  match<C extends CasesObj>(casesObj: C): ReturnType<C[keyof C]>;
}

export function makeMatch<T extends { [key: string]: any }>(defObj: T) {
  const MATCH_TYPE = Symbol("MATCH_TYPE");
  const MATCH_DATA = Symbol("MATCH_DATA");

  type DefObj = typeof defObj;

  type DataMap = {
    [Property in keyof DefObj]: DefObj[Property] extends (...args: any) => any
      ? ReturnType<DefObj[Property]>
      : DefObj[Property];
  };

  type CasesObjFull = {
    [Property in keyof DataMap]: (data: DataMap[Property]) => any;
  };

  type CasesObjPartialWithDefaultHandler = Partial<CasesObjFull> & {
    _: <Property extends keyof DataMap>(data: DataMap[Property]) => any;
  };

  type MatchConfiguration = CasesObjFull | CasesObjPartialWithDefaultHandler;

  class MatchInstance<Key extends keyof DataMap> {
    [MATCH_TYPE]: Key;
    [MATCH_DATA]: DataMap[Key];

    constructor(MatchType: Key, data: DataMap[Key]) {
      this[MATCH_TYPE] = MatchType;
      this[MATCH_DATA] = data;
    }

    // @ts-ignore
    match<C extends CasesObj<any>>(casesObj: C): ReturnType<C[keyof C]> {
      const data = this[MATCH_DATA];
      // @ts-ignore
      const matchingHandler = casesObj[this[MATCH_TYPE]];

      if (matchingHandler) {
        // @ts-ignore
        return matchingHandler(data);

        // @ts-ignore
      } else if (casesObj._) {
        // @ts-ignore
        return casesObj._(data);
      }
    }
  }

  type Match = {
    [Property in keyof DefObj]: DefObj[Property] extends (...args: any) => any
      ? (
          ...args: Parameters<DefObj[Property]>
        ) => MatchInterface<MatchConfiguration>
      : MatchInterface<MatchConfiguration>;
  };

  // @ts-ignore
  const matchObj: Match = {};

  Object.keys(defObj).forEach((matchType) => {
    const value = defObj[matchType];

    if (typeof value === "function") {
      // @ts-ignore
      matchObj[matchType] = (...args: any) => {
        const data = value(...args);
        // @ts-ignore
        return new MatchInstance(matchType, data);
      };
    } else {
      // @ts-ignore
      matchObj[matchType] = new MatchInstance(matchType);
    }
  });

  return matchObj;
}
