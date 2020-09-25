// @flow
import {
  makeTaggedUnion,
  type MemberType,
  none,
  type None,
  type TaggedUnion,
} from "./index";
import type { Invalid } from "./Invalid";

type StateType = MemberType<typeof State>;
const State = makeTaggedUnion({
  unstarted: none,
  running: (output: string) => output,
  exited: (output: string, exitCode: number) => ({ output, exitCode }),
});

const state: StateType = State.unstarted;
const state2: StateType = State.running("");

state.variant;
state.data;

const result = state.match({
  unstarted: () => "hi",
  running: (output) => {
    // (output: string);
    return output.length;
  },
  exited: ({ output, exitCode }) => {
    // (output: string);
    // (exitCode: number);
    return 3;
  },
  _: () => 4,
});
(result: number | string);

// next line should error
(result: Invalid);

type HealthType = MemberType<typeof Health>;
const Health = makeTaggedUnion({
  unknown: none,
  up: none,
  down: none,
  checking: (time: number) => time,
});

const health: HealthType = Health.checking(3);
const health2: HealthType = Health.unknown;

const result2 = health.match({
  checking: (time) => {
    // (time: number);
    return time;
  },
  _: () => true,
});
(result2: boolean | number);

// next line should error
(result2: Invalid);

// next line should error for not checking all cases
health.match({
  checking: () => "hi",
});

const switchDef = {
  on: (voltage: number, current: number) => ({ voltage, current }),
  off: none,
};
const Switch = makeTaggedUnion(switchDef);

(Switch: TaggedUnion<typeof switchDef>);
