import { resolvePersonaEnabledSkills } from "./personaRequestConfig";

export function resolveRunEnabledSkills({
  personaPresetId,
  personaEnabledSkills,
  runEnabledSkills,
}: {
  personaPresetId?: string | null;
  personaEnabledSkills?: string[];
  runEnabledSkills?: string[];
}): string[] | undefined {
  if (runEnabledSkills) {
    return runEnabledSkills;
  }
  return resolvePersonaEnabledSkills(personaPresetId, personaEnabledSkills);
}
