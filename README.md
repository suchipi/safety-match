# safety-match

`safety-match` provides Rust-style tagged union matching for JavaScript, with TypeScript types.

This README is pretty rough around the edges; I'll make it better later.

## Usage Example

```ts
import { makeTaggedUnion } from "safety-match";

// makeTaggedUnion creates an object with properties
// cooresponding to the properties on the object you
// pass in to makeTaggedUnion.
const State = makeTaggedUnion({
  // The format here is:
  // StateName : (constructorArguments) => data
  // It'll make more sense in a bit.

  // This defines a state called 'Loading', that is constructed
  // with a number, and holds its data as an object
  // with a `percentLoaded` property.
  Loading: (percentLoaded: number) => ({ percentLoaded }),

  // This defines a state called 'Loaded', that is constructed
  // with a Buffer, and holds its data as a Buffer.
  Loaded: (response: Buffer) => response,

  // This defines a state called 'Unstarted', that has no data
  // in it, and therefore does not need to be constructed.
  Unstarted: null,
});

let state = State.Unstarted;
// or eg:
// let state = States.Loading(55);

// state.match runs the handler that matches the current state,
// passing in the data for that state (if any).
const statusLine = state.match({
  Unstarted: () => "Waiting...",
  Loading: ({ percentComplete }) => {
    return `${percentComplete} percent loaded`;
  },
  Loaded: (response) => {
    return `Loaded: ${response}`;
  },
});

const percentComplete = state.match({
  Unstarted: () => 0,
  Loading: ({ percentComplete }) => percentComplete,
  Loaded: () => 100,
});

const isLoaded = state.match({
  Loaded: () => true,

  // `_` property is the default handler for
  // all types not explicitly handled
  _: () => false,
});

// If you want the Typescript type of a matchable member of the tagged union, you can use `MemberType`:
import { MemberType } from "safety-match";
type StateType = MemberType<typeof State>;
```

## Notes

## Warning: TypeScript support caveat

The TypeScript support only works right if you set `compilerOptions.strict` to `true` in your `tsconfig.json`.

## License

MIT
