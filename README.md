# safety-match

`safety-match` provides pattern matching for JavaScript, TypeScript, and Flow.

## Why?

The point of `safety-match` is that I wanted to bring [Rust's experience of pattern-matching on enums](https://doc.rust-lang.org/1.1.0/book/match.html#matching-on-enums) to JavaScript.

Let me explain that experience a bit.

Enums in Rust are types that describe different "variants" that live in the same type. So, you might want an enum that holds "off", and "on". Or an enum that holds "loading", "loaded", and "error". Any time you have a value that can take on one of several distinct states, you can model it with an enum.

When you define an enum in Rust, you use syntax like this:

```rs
enum Message {
  Quit,
  ChangeColor(i32, i32, i32),
  Write(String),
}
```

The first line defines the name of the enum; in this case, `Message`.

Every line inside of the curly braces (`{}`) defines a variant of the enum.

Some of the variants can hold additional data inside them (in this case for example, `Write` holds a `String`), but some don't hold any extra data (like `Quit` in this case).

Once you have made an enum, you can use it like a type, and match over instances of it:

```rs
// Given msg is an instance of the Message enum
match msg {
  Message::Quit => quit(),
  Message::ChangeColor(r, g, b) => change_color(r, g, b),
  Message::Write(s) => println!("{}", s),
};
```

On the first line, we use the `match` keyword to do a pattern match. `match` takes an expression and then branches based on its value.

Then inside the curly braces (`{}`), each line tells the program what to do if the variant on the left side of the `=>` matches the one in `msg`.

You could also use `_` inside the curly braces to mean "and if it's any variant not listed here":

```rs
// Given msg is an instance of the Message enum
match msg {
  Message::Quit => quit(),
  // This _ would get used for ChangeColor or Write, or any other variants added to the enum in the future.
  _ => println!("Not quitting!"),
};
```

At first glance, it looks similar to a `switch` statement in JavaScript; you could imitate it using a switch statement by doing something like this:

```ts
type Message =
  | { variant: "Quit" }
  | { variant: "ChangeColor", r: number, g: number, b: number }
  | { variant: "Write", s: string };

const msg = /* get a Message from somewhere */;

switch(msg.variant) {
  case "Quit": {
    quit();
    break;
  }
  case "ChangeColor": {
    change_color(msg.r, msg.g, msg.b);
    break;
  }
  case "Write": {
    console.log(msg.s);
    break;
  }
}
```

But `match` is more powerful for several reasons:

- If you don't handle all the variants, the compiler will warn you that you forgot some
- You have to remember to put a `break` in every case, otherwise the code execution will fall through.
- `switch` is a statement, not an expression, so if you want to create a value based on a switch statement, you can't just do `const something = switch(...) {...}`. You have to instead declare an empty variable, and then fill it in in every case.

Once you have gotten used to programming using `match`, it's hard to go back. `switch` or `if/else` feels clunky, and all the nice warnings your compiler gave you to help you aren't there anymore.

So, I built `safety-match` to bring this experience to JavaScript, by leveraging TypeScript/Flow.

Here's what it looks like. Note that instead of using the word "enum" like in Rust, I opted to instead call them ["Tagged Unions"](https://en.wikipedia.org/wiki/Tagged_union), because TypeScript already has a concept of "enums", and I didn't want to confuse people.

```ts
import {makeTaggedUnion, none} from "safety-match";

const Message = makeTaggedUnion({
  Quit: none,
  ChangeColor: (r: number, g: number, b: number) => ({ r, g, b }),
  Write: (output: string) => output,
};

const msg = Message.Quit;
// Or:
const msg = Message.ChangeColor(127, 255, 0);
// Or:
const msg = Message.Write("Hello");

// But whichever you do, once you have a message:
msg.match({
  Quit: () => quit(),
  ChangeColor: ({r, g, b}) => change_color(r, g, b),
  Write: (output) => console.log(output),
});
```

It's not quite as succinct, since we're limited to JavaScript's syntax, but hopefully you can see the similarity to Rust's `enum` and `match`.

My solution provides the same advantages over switch statements that I mentioned earlier:

- If you don't handle all the variants, either TypeScript or Flow will warn you that you forgot some (depending on which you use)
- You don't have to put `break`s in
- `msg.match(...)` is an expression, and it evaluates to the return value of each match handler.

I'll explain everything that's going on in the "Usage and Explanation" section below.

## Usage and Explanation

> If you have not already read the "Why?" section, I highly recommend you do so. It explains some concepts and background knowledge that are necessary to understand why we're going through all this trouble.

To use `safety-match`, first you import two things from it: `makeTaggedUnion` and `none`:

```ts
import { makeTaggedUnion, none } from "safety-match";
```

`makeTaggedUnion` is a function that:

- You call with an object whose property values are either functions or `none`. We call this object you pass in a `DefinitionObject`,
- Returns a new object to you. We call this object that gets returned a `TaggedUnion`.

You can visualize it like this:

<!-- prettier-ignore -->
```ts
type DefinitionObject = { [key: string]: Function | typeof none };
type TaggedUnion = {/* We'll explain what's in this object below! */};

makeTaggedUnion = (defObj: DefinitionObject) => TaggedUnion;
```

> Each property key on a `DefinitionObject` is called a "Variant".

The properties on the `TaggedUnion` depend on the properties that were present on the `DefinitionObject` you passed in.

The key of each property matches the key of the property on the `DefinitionObject`, so if you passed in a `DefinitionObject` with two properties on it, then you would get a `TaggedUnion` with two properties on it:

```ts
import { makeTaggedUnion, none } from "safety-match";

const myTaggedUnion = makeTaggedUnion({ on, off }); // Don't worry about the values here for now; we'll explain that below.
console.log(Object.keys(myTaggedUnion)); // ["on", "off"]
```

The value of each property on the returned `TaggedUnion` depends on the value of the property with the same name on the `DefinitionObject`.

In order to understand what the values are, you'll need to understand a type called `MemberObject`.

A `MemberObject` is an object that represents an "instance" of the union you're describing with `makeTaggedUnion`. They're what you can `match` against!
Every `MemberObject` has a string representing which variant it is and can hold some data. You can visualize them like this:

```ts
type MemberObject = {
  variant: string;
  data: any;
};
```

So, for each property that was on your `DefinitionObject`, the corresponding property on the `TaggedUnion` is as follows:

- If the `DefinitionObject`'s property value was `none` (the other thing you imported), then the `TaggedUnion`'s corresponding property is a `MemberObject` whose data property holds `undefined`, and whose variant property holds the key from the property on the `DefinitionObject`.
- If the `DefinitionObject`'s property value was instead a function, then the `TaggedUnion`'s corresponding property is a function that accepts the same parameters as the function on the `DefinitionObject`, and returns a `MemberObject` whose data property holds the return value of the function on the `DefinitionObject`, and whose variant property holds the key from the property on the `DefinitionObject`.

You can visualize this as follows:

<!-- prettier-ignore -->
```ts
type TaggedUnion = {
  [for every property in the DefinitionObject you passed in]:
    | { /* if the property value was none: */
      variant: the property key,
      data: undefined
    }
    | / * if the property value was a function: */
      (...args: Parameters<the function that was on this property>) => {
        variant: the property key,
        data: ReturnType<the function that was on this property>
      }
}
```

So, more concretely, if we did this:

```ts
import { makeTaggedUnion, none } from "safety-match";

const myTaggedUnion = makeTaggedUnion({
  on: (voltage: number, current: number) => ({ voltage, current }),
  off: none,
});
```

Then `myTaggedUnion` would have this type:

```ts
{
  on: (voltage: number, current: number) => {
    variant: "on",
    data: { voltage: number, current: number }
  },
  off: {
    variant: "off",
    data: undefined
  }
}
```

Which means that you could get a `MemberObject` from `myTaggedUnion` like this:

```ts
const memberObj = myTaggedUnion.off; // memberObj is a MemberObject with variant "off" and data undefined
const anotherMemberObj = myTaggedUnion.on(3.3, 0.1); // anotherMemberObj is a MemberObject with variant "on" and data { voltage: 3.3, current: 0.1 }
```

Now, the point of doing all this, is that you can `match` over a `MemberObject` whose variant you don't know, and treat it differently depending on which variant it is.

Remember earlier how I said you could visualize a `MemberObject` like this?

```ts
type MemberObject = {
  variant: string;
  data: any;
};
```

Well, that's not actually the whole story. `MemberObject`s also have a `match` property on them:

```ts
type MemberObject = {
  variant: string;
  data: any;
  match: Function;
};
```

It's a function that you can call to branch execution depending on the `type` of the `MemberObject`.

To use it, you pass in an object we call the "Cases Object". This object should have a property for each variant, whose value is a function to be run if the `MemberObject` being matched has the variant in question. The function will receive the `MemberObject`'s data.

Here's what it looks like to use, using a `MemberObject` from the `myTaggedUnion` from earlier code blocks:

```ts
// Assuming a variable named `memberObj` is defined, which is a MemberObject from `myTaggedUnion`:
memberObj.match({
  on: ({ voltage, current }) => {
    console.log(`Voltage: ${voltage}, Current: ${current}`);
  },
  off: () => {
    console.log("The system is off.");
  },
});
```

We can also use the property key `_` in the Cases Object. If we do that, we don't have to specify every variant; any variants we don't specify will get handled by the `_` handler.

Using `_` isn't very useful for a `TaggedUnion` with only 2 variants, but with more variants, it's more useful. Here's an example that uses a `TaggedUnion` with more variants:

```ts
const LoadState = makeTaggedUnion({
  Unstarted: none,
  Loading: (percentLoaded: number) => percentLoaded,
  Loaded: (response: Buffer) => response,
  Error: (error: Error) => error,
});

const state = /* a MemberObject from LoadState */

const amountLoaded: number = state.match({
  Loading: (percentLoaded) => percentLoaded,
  Loaded: () => 100,
  _: () => 0,
});

const errorMessage: string | null = state.match({
  Error: (error) => error.message,
  _: () => null,
});
```

Now that you understand:

- How to make a `TaggedUnion`,
- how to get `MemberObject`s from that `TaggedUnion`,
- and how to use `match` on `MemberObject`s to branch behavior,

The only thing left that you need to know is how to get a type that describes a `MemberObject` for a given `TaggedUnion`.

This is important, since the idea of `safety-match` is that you'll pass `MemberObject`s around that represent values in your application. So you'll need to annotate functions that receive or return `MemberObject`s appropriately.

The way you do this is by using a helper type from the `safety-match` package called `MemberType`:

```ts
// TypeScript:
import {MemberType} from "safety-match";
// Flow:
import {type MemberType} from "safety-match";
```

Then you pass your `TaggedUnion` in as a type parameter to `MemberType` to get a new type that described the `MemberObject`s for that `TaggedUnion`:

```ts
const myTaggedUnion = makeTaggedUnion({
  on: (voltage: number, current: number) => ({ voltage, current }),
  off: none,
});

type myTaggedUnionMember = MemberType<typeof myTaggedUnion>;
```

Now you can use it anywhere you would use a type annotation:

```ts
// In a variable definition...
const memberObj: myTaggedUnionMember = myTaggedUnion.off;

// In a function parameter...
function displayStringForMemberObj(obj: myTaggedUnionMember) {
  return obj.match({
    on: (voltage: number, current: number) =>
      `voltage: ${voltage} volts, current: ${current} amps`,
    off: () => `system is off`,
  });
}

// Etc
```

If you are using TypeScript, you can even give the member type the same name as the `TaggedUnion` variable:

```ts
const LoadState = makeTaggedUnion({
  Unstarted: none,
  Loading: (percentLoaded: number) => percentLoaded,
  Loaded: (response: Buffer) => response,
  Error: (error: Error) => error,
});
type LoadState = MemberType<typeof LoadState>;

let state: LoadState = LoadState.Unstarted;
```

But this isn't supported in Flow.

## Note About the `variant` Property

Although a `MemberObject` has a `variant` property, and you could theoretically use it in an `if` or `switch` statement, you should generally rely on `.match` for branching behavior instead.

However, it's often useful to use the `variant` property when logging a `MemberObject`.

## Flow Limitations

### Data falls back to any in some (uncommon) places

Due to limitations in Flow, there are a few places where TypeScript knows what type something is, but Flow does not (and has to use `any` instead). These are:

- The data passed into a `_` handler in a match
- The `data` property on a `MemberObject` (but not the data passed into non-`_` match handlers; those are typed).

### Old versions don't handle match properly

If you're using an old version of flow, match might report errors even though you're using it correctly. The current version of flow at time of writing is 0.134.0.

### May need to annotate `TaggedUnion`s in `types_first` mode

If flow is configured to use `types_first` mode (which is the default in flow 0.134.0 and higher), you may need to annotate your `TaggedUnion` objects in order to export them from modules. You'll know you need to do this if flow gives you an error like this:

```
Cannot build a typed interface for this module. You should annotate the exports of this module with types. Cannot determine the type of this call expression. Please provide an annotation, e.g., by adding a type cast around this expression.
```

If you get such an error, and your code looks something like this:

```ts
import { makeTaggedUnion, none } from "safety-match";

export const myTaggedUnion = makeTaggedUnion({
  /* variants... */
});
```

You can make flow happy by changing it to this:

```ts
import {makeTaggedUnion, none, type TaggedUnion} from "safety-match";

const myDefObj = {
  /* variants... */
};

export const myTaggedUnion: TaggedUnion<typeof myDefObj> = makeTaggedUnions(myDefObj);
```

## License

MIT
