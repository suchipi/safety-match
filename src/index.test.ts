import { makeTaggedUnion, MemberType, none } from "./index";

describe("makeTaggedUnion", () => {
  test("exhaustive matching", () => {
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

  test("non-exhaustive matching", () => {
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

  test("with generics", () => {
    // Generic support is not great, but it doesn't yell at least

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
    // this one works better but it's not super discoverable

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
});
