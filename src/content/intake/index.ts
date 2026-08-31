import { IntakeSchema, type Intake } from "../schema";
import pairs from "./pairs.json";
import defaultSetting from "./default-setting.json";
import baseline from "./baseline.json";
import typeDescriptions from "./types.json";

/** §6.5.4 Recorded. Not used for anything. We were just curious. */
export const STAR_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

/**
 * Parsed once at module load. A malformed intake is a hard failure here and in
 * `scripts/validate-content.ts`, so it can never reach a learner mid-session.
 */
export const intake: Intake = IntakeSchema.parse({
  version: "1.0.0",
  pairs,
  default_setting_items: defaultSetting.items,
  default_settings: defaultSetting.settings,
  baseline,
  star_signs: STAR_SIGNS,
  type_descriptions: typeDescriptions,
});
