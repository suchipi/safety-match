// @flow
import { makeTaggedUnion, type MemberType, none, type None } from "./index";
import type { Invalid } from "./Invalid";

type StateType = MemberType<typeof State>;
const State = makeTaggedUnion({
  unstarted: none,
  running: (output: string) => output,
  exited: (output: string, exitCode: number) => ({ output, exitCode }),
});

const state: StateType = State.unstarted;
const state2: StateType = State.running("");

const stateDataMap =
  State.__datamap_for_testing_flow_not_here_at_runtime_do_not_use_this;

// These should pass
(stateDataMap.unstarted: void);
(stateDataMap.running: string);
(stateDataMap.exited: { output: string, exitCode: number });

// These should fail
(stateDataMap.unstarted: Invalid);
(stateDataMap.running: Invalid);
(stateDataMap.exited: Invalid);

const stateDataMapWithNones =
  State.__datamap_with_nones_for_testing_flow_not_here_at_runtime_do_not_use_this;

// These should pass
(stateDataMapWithNones.unstarted: None);
(stateDataMapWithNones.running: string);
(stateDataMapWithNones.exited: { output: string, exitCode: number });

// These should fail
(stateDataMapWithNones.unstarted: Invalid);
(stateDataMapWithNones.running: Invalid);
(stateDataMapWithNones.exited: Invalid);

const result = state.match({
  unstarted: () => "hi",
  running: (output) => {
    (output: string);
    return 2;
  },
  exited: ({ output, exitCode }) => {
    (output: string);
    (exitCode: number);
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
    (time: number);
    return "hi";
  },
  _: () => true,
});
(result2: boolean | string);

// next line should error
(result2: Invalid);

// next line should error for not checking all cases
health.match({
  checking: () => "hi",
});
