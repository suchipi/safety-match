export const none = Symbol();

export type None = typeof none;

const MEMBER_TYPE = Symbol();

export type MemberType<
  TaggedUnionT extends {
    [MEMBER_TYPE]: any;
  }
> = TaggedUnionT[typeof MEMBER_TYPE];

type DefObjSuper = { [key: string]: None | ((...args: any[]) => any) };

type DataMap<DefObj extends DefObjSuper> = {
  [Property in keyof DefObj]: DefObj[Property] extends (...args: any) => any
    ? ReturnType<DefObj[Property]>
    : DefObj[Property] extends None
    ? undefined
    : DefObj[Property];
};

type CasesObjFull<DefObj extends DefObjSuper> = {
  [Property in keyof DataMap<DefObj>]: DataMap<DefObj>[Property] extends None
    ? () => any
    : (data: DataMap<DefObj>[Property]) => any;
};

type if_you_are_seeing_this_then_your_match_didnt_either_handle_all_cases_or_provide_a_default_handler_using_underscore<
  DefObj extends DefObjSuper
> = Partial<CasesObjFull<DefObj>> & {
  _: <Property extends keyof DataMap<DefObj>>(
    data: DataMap<DefObj>[Property]
  ) => any;
};

type MatchConfiguration<DefObj extends DefObjSuper> =
  | CasesObjFull<DefObj>
  | if_you_are_seeing_this_then_your_match_didnt_either_handle_all_cases_or_provide_a_default_handler_using_underscore<
      DefObj
    >;

class MemberObjectImpl {
  variant: any;
  data: any;

  constructor(variant: any, data: any) {
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

interface MemberObject<DefObj extends DefObjSuper> {
  match<C extends MatchConfiguration<DefObj>>(
    casesObj: C
  ): ReturnType<Exclude<C[keyof C], undefined>>;
  variant: keyof DefObj;
  data: DataMap<DefObj>[keyof DefObj];
}

type TaggedUnion<DefObj extends DefObjSuper> = {
  [Property in keyof DefObj]: DefObj[Property] extends (...args: any) => any
    ? (...args: Parameters<DefObj[Property]>) => MemberObject<DefObj>
    : MemberObject<DefObj>;
} & {
  [MEMBER_TYPE]: MemberObject<DefObj>;
};

export function makeTaggedUnion<DefObj extends DefObjSuper>(
  defObj: DefObj
): TaggedUnion<DefObj> {
  const matchObj: any = {};

  Object.keys(defObj).forEach((matchType) => {
    const value = defObj[matchType];

    if (typeof value === "function") {
      matchObj[matchType] = (...args: any) => {
        const data = value(...args);
        return new MemberObjectImpl(matchType, data);
      };
    } else {
      matchObj[matchType] = new MemberObjectImpl(matchType, undefined);
    }
  });

  return matchObj;
}
