import { UnitVarietySchema, type Unit } from "../schema";
import w00Meta from "./w00-questions/unit.json";
import w00ColdOpen from "./w00-questions/00-cold-open.json";
import w00Recognise from "./w00-questions/03-recognise.json";
import w00Simulator from "./w00-questions/04-simulator.json";
import w00Mess from "./w00-questions/05-mess.json";
import w00BuildIt from "./w00-questions/06-build-it.json";
import w01Meta from "./w01-agency/unit.json";
import w01ColdOpen from "./w01-agency/00-cold-open.json";
import w01Recognise from "./w01-agency/03-recognise.json";
import w01Simulator from "./w01-agency/04-simulator.json";
import w01Mess from "./w01-agency/05-mess.json";
import w01BuildIt from "./w01-agency/06-build-it.json";

/**
 * §8 Units are composed from their step files so each step stays diffable and
 * reviewable on its own, then validated as a whole so a unit can never ship
 * with a dangling simulator node or a missing register.
 */
function compose(
  meta: unknown,
  parts: {
    cold_open: unknown;
    recognise: unknown;
    simulator: unknown;
    mess: unknown;
    build_it: unknown;
  },
): Unit {
  return UnitVarietySchema.parse({ ...(meta as object), ...parts });
}

export const units: Unit[] = [
  compose(w00Meta, {
    cold_open: w00ColdOpen,
    recognise: w00Recognise,
    simulator: w00Simulator,
    mess: w00Mess,
    build_it: w00BuildIt,
  }),
  compose(w01Meta, {
    cold_open: w01ColdOpen,
    recognise: w01Recognise,
    simulator: w01Simulator,
    mess: w01Mess,
    build_it: w01BuildIt,
  }),
];

export const unitsById = new Map(units.map((u) => [u.id, u]));

export function getUnit(id: string): Unit | undefined {
  return unitsById.get(id);
}
