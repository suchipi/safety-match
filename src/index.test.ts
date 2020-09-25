import { makeTaggedUnion, MemberType, none } from "./index";

describe("makeTaggedUnion", () => {
  test("exhaustive matching behavior", () => {
    const foobar = makeTaggedUnion({
      FOO: none,
      BAR: none,
      BAZ: () => 6,
    });

    expect(foobar.FOO).toBeDefined();
    expect(foobar.BAR).toBeDefined();

    const value = foobar.FOO;
    const callMe = jest.fn().mockReturnValue(4);
    const dontCallMe = jest.fn().mockReturnValue(5);
    const dontCallMeEither = jest.fn().mockReturnValue(6);
    const ret = value.match({
      FOO: callMe,
      BAR: dontCallMe,
      BAZ: dontCallMeEither,
    });

    expect(callMe).toHaveBeenCalledTimes(1);
    expect(dontCallMe).not.toHaveBeenCalled();
    expect(ret).toBe(4);
  });

  test("exhaustive matching types", () => {
    const foobar = makeTaggedUnion({
      FOO: none,
      BAR: none,
      BAZ: () => 6,
    });

    expect(foobar.FOO).toBeDefined();
    expect(foobar.BAR).toBeDefined();

    const value = foobar.FOO;
    const ret = value.match({
      FOO: () => 4,
      BAR: () => 5,
      BAZ: () => 6,
    });
    ret;

    // hover over ret; it should be number

    const ret2 = value.match({
      FOO: () => 4,
      BAR: () => "hi",
      BAZ: () => undefined,
    });
    ret2;

    // hover over ret2; it should be string | number | undefined
  });

  test("non-exhaustive matching behavior", () => {
    const foobar = makeTaggedUnion({
      FOO: none,
      BAR: none,
      BAZ: () => 6,
    });

    expect(foobar.FOO).toBeDefined();
    expect(foobar.BAR).toBeDefined();

    const value = foobar.BAZ();
    const callMe = jest.fn().mockImplementation((data) => data);
    const dontCallMe = jest.fn().mockReturnValue(5);
    const dontCallMeEither = jest.fn().mockReturnValue(6);
    const ret = value.match({
      FOO: dontCallMe,
      BAR: dontCallMeEither,
      _: callMe,
    });

    expect(callMe).toHaveBeenCalledTimes(1);
    expect(dontCallMe).not.toHaveBeenCalled();
    expect(ret).toBe(6);
  });

  test("non-exhaustive matching types", () => {
    const foobar = makeTaggedUnion({
      FOO: none,
      BAR: none,
      BAZ: () => 6,
    });

    expect(foobar.FOO).toBeDefined();
    expect(foobar.BAR).toBeDefined();

    const value = foobar.BAZ();
    const ret = value.match({
      FOO: () => 5,
      BAR: () => 6,
      _: () => "hi",
    });
    ret;

    // hover over ret; it should be string | number

    const ret2 = value.match({
      BAZ: (data) => data,
      _: () => 0,
    });
    ret2;

    // hover over ret2; it should be number

    const ret3 = value.match({
      FOO: () => 5,
      BAR: () => 6,
      _: (data) => data,
    });
    ret3;

    // hover over ret3; ideally, it should be number, since the only remaining
    // variant's data type is number. but it looks like it's number | undefined
    // because the `data` going into the `_` case isn't refined to not include
    // the data types for the FOO and BAR variants. Not ideal, but it's fine.
  });

  test("with generics", () => {
    // Generic support is not great, but it doesn't yell at least.
    // the T below nevers gets a type, so it's `unknown`.

    const Maybe = makeTaggedUnion({
      Some: <T>(data: T) => ({ data }),
      None: none,
    });

    const data = Maybe.Some(4);

    data.match({
      Some: ({ data }) => data,
      None: () => "doot",
    });
  });

  test("with generics 2", () => {
    // this one works better, because T gets a type, but it's not super
    // discoverable (and means you can't just have one Maybe type).

    function makeMaybe<T>() {
      return makeTaggedUnion({
        Some: (data: T) => ({ data }),
        None: none,
      });
    }

    const Maybe = makeMaybe<string>();

    const data = Maybe.Some("woo");

    data.match({
      Some: ({ data }) => data,
      None: () => "doot",
    });
  });

  test("extracting member type", () => {
    const State = makeTaggedUnion({
      Some: (data: string) => ({ data }),
      None: none,
    });
    type State = MemberType<typeof State>;

    const data: State = State.None;

    data.match({
      Some: ({ data }) => data,
      // _: () => {},
      None: () => data,
    });
  });

  test("variant property", () => {
    const State = makeTaggedUnion({
      Some: (data: string) => ({ data }),
      None: none,
    });

    const state = State.None;

    expect(state.variant).toBe("None");
  });

  test("data property", () => {
    const State = makeTaggedUnion({
      Some: (data: number) => data,
      None: none,
    });

    const state = State.Some(42);

    expect(state.data).toBe(42);
  });

  test("MemberObject name", () => {
    const State = makeTaggedUnion({
      Some: (data: number) => data,
      None: none,
    });

    const state = State.Some(42);
    expect(state.constructor.name).toBe("MemberObject");
  });
});
