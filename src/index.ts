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
  type DefObj = typeof defObj;

  type DataMap = {
    [Property in keyof DefObj]: DefObj[Property] extends (...args: any) => any
      ? ReturnType<DefObj[Property]>
      : DefObj[Property] extends typeof none
      ? undefined
      : DefObj[Property];
  };

  type CasesObjFull = {
    [Property in keyof DataMap]: DataMap[Property] extends typeof none
      ? () => any
      : (data: DataMap[Property]) => any;
  };

  type if_you_are_seeing_this_then_your_match_didnt_either_handle_all_cases_or_provide_a_default_handler_using_underscore = Partial<
    CasesObjFull
  > & {
    _: <Property extends keyof DataMap>(data: DataMap[Property]) => any;
  };

  type MatchConfiguration =
    | CasesObjFull
    | if_you_are_seeing_this_then_your_match_didnt_either_handle_all_cases_or_provide_a_default_handler_using_underscore;

  class MemberObject<Variant extends keyof DataMap> {
    variant: Variant;
    data: DataMap[Variant];

    constructor(variant: Variant, data: DataMap[Variant]) {
      this.variant = variant;
      this.data = data;
    }

    match(casesObj: any): any {
      const data = this.data;
      const matchingHandler = casesObj[this.variant];

      if (matchingHandler) {
        return matchingHandler(data);
      } else if (casesObj._) {
        return casesObj._(data);
      } else {
        throw new Error(`Match did not handle variant: '${this.variant}'`);
      }
    }
  }

  // prettier-ignore
  interface TaggedUnionMember
  // @ts-ignore
  <T extends {}>
  {
    match<C extends MatchConfiguration>(casesObj: C): ReturnType<
      Exclude<C[keyof C], undefined>
		>;
		variant: keyof DefObj;
		data: DataMap[keyof DefObj];
  }

  type TaggedUnion<T> = {
    [Property in keyof T]: T[Property] extends (...args: any) => any
      ? (...args: Parameters<T[Property]>) => TaggedUnionMember<T>
      : TaggedUnionMember<T>;
  } & {
    [MEMBER_TYPE]: TaggedUnionMember<T>;
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
        return new MemberObject(matchType, data);
      };
    } else {
      // @ts-ignore
      matchObj[matchType] = new MemberObject(matchType);
    }
  });

  return matchObj;
}
