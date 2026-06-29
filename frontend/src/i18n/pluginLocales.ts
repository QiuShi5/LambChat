export type PluginLocaleResource = Record<string, unknown>;

const SUPPORTED_PLUGIN_LOCALE_LANGUAGES = new Set(["en", "zh", "ja", "ko", "ru"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeLocaleModule(moduleValue: unknown): PluginLocaleResource | null {
  if (isRecord(moduleValue) && isRecord(moduleValue.default)) {
    return moduleValue.default;
  }
  return isRecord(moduleValue) ? moduleValue : null;
}

function languageFromLocalePath(path: string): string | null {
  const match = path.replaceAll("\\", "/").match(/\/locales\/([^/.]+)\.json$/);
  if (!match) return null;
  const language = match[1];
  return SUPPORTED_PLUGIN_LOCALE_LANGUAGES.has(language) ? language : null;
}

export function mergeLocaleResource(
  base: PluginLocaleResource,
  next: PluginLocaleResource,
): PluginLocaleResource {
  const merged: PluginLocaleResource = { ...base };
  for (const [key, value] of Object.entries(next)) {
    const current = merged[key];
    if (isRecord(current) && isRecord(value)) {
      merged[key] = mergeLocaleResource(current, value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

export function collectPluginLocaleResources(
  modules: Record<string, unknown>,
): Record<string, PluginLocaleResource> {
  const resources: Record<string, PluginLocaleResource> = {};
  for (const [path, moduleValue] of Object.entries(modules)) {
    const language = languageFromLocalePath(path);
    const locale = normalizeLocaleModule(moduleValue);
    if (!language || !locale) continue;
    resources[language] = mergeLocaleResource(resources[language] ?? {}, locale);
  }
  return resources;
}

export function loadBundledPluginLocaleResources(): Record<string, PluginLocaleResource> {
  return collectPluginLocaleResources(
    import.meta.glob<PluginLocaleResource>([
      "../../../plugins/system/*/frontend/locales/*.json",
      "../../../plugins/preinstalled/*/frontend/locales/*.json",
    ], {
      eager: true,
      import: "default",
    }),
  );
}
