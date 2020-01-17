interface TaggedUnionMember<
  // @ts-ignore
  T extends {},
  CasesObj extends { [key: string]: (...args: any) => any }
> {
  match<C extends CasesObj>(casesObj: C): ReturnType<C[keyof C]>;
}

export const none = Symbol();

const MEMBER_TYPE = Symbol();

export type MemberType<
  TaggedUnionT extends {
    [MEMBER_TYPE]: any;
  }
> = TaggedUnionT[typeof MEMBER_TYPE];

export function makeTaggedUnion<
  T extends { [key: string]: typeof none | ((...args: any[]) => any) }
>(defObj: T) {
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

  class TaggedUnionImpl<Key extends keyof DataMap> {
    [MATCH_TYPE]: Key;
    [MATCH_DATA]: DataMap[Key];

    constructor(MatchType: Key, data: DataMap[Key]) {
      this[MATCH_TYPE] = MatchType;
      this[MATCH_DATA] = data;
    }

    match(casesObj: any): any {
      const data = this[MATCH_DATA];
      const matchingHandler = casesObj[this[MATCH_TYPE]];

      if (matchingHandler) {
        return matchingHandler(data);
      } else if (casesObj._) {
        return casesObj._(data);
      }
    }
  }

  type TaggedUnion<T> = {
    [Property in keyof T]: T[Property] extends (...args: any) => any
      ? (
          ...args: Parameters<T[Property]>
        ) => TaggedUnionMember<T, MatchConfiguration>
      : TaggedUnionMember<T, MatchConfiguration>;
  } & {
    [MEMBER_TYPE]: TaggedUnionMember<T, MatchConfiguration>;
  };

  // @ts-ignore
  const matchObj: TaggedUnion<T> = {};

  Object.keys(defObj).forEach((matchType) => {
    const value = defObj[matchType];

    if (typeof value === "function") {
      // @ts-ignore
      matchObj[matchType] = (...args: any) => {
        const data = value(...args);
        // @ts-ignore
        return new TaggedUnionImpl(matchType, data);
      };
    } else {
      // @ts-ignore
      matchObj[matchType] = new TaggedUnionImpl(matchType);
    }
  });

  return matchObj;
}
