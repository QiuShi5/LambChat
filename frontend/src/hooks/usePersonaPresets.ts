import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { personaPresetApi } from "../services/api";
import { subscribePersonaPresetsChanged } from "./personaPresetEvents";
import type {
  PersonaPreset,
  PersonaPresetCreate,
  PersonaPresetListParams,
  PersonaPresetPreferenceUpdate,
  PersonaPresetSnapshot,
  PersonaPresetUpdate,
} from "../types";

export function usePersonaPresets(options?: { enabled?: boolean }) {
  const { t } = useTranslation();
  const enabled = options?.enabled !== false;
  const [presets, setPresets] = useState<PersonaPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresets = useCallback(
    async (params: PersonaPresetListParams = {}) => {
      if (!enabled) return;
      setIsLoading(true);
      setError(null);
      try {
        let allPresets: PersonaPreset[] = [];
        let skip = 0;
        const pageSize = 200;
        const listParams = { ...params, limit: pageSize };
        while (true) {
          const response = await personaPresetApi.list({ ...listParams, skip });
          allPresets = allPresets.concat(response.presets);
          skip += response.presets.length;
          if (skip >= response.total || response.presets.length < pageSize)
            break;
        }
        setPresets(allPresets);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t(
                "personaPresets.fetchFailed",
                "Failed to fetch persona presets",
              ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, t],
  );

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  useEffect(() => {
    if (!enabled) return;
    return subscribePersonaPresetsChanged(() => {
      void fetchPresets();
    });
  }, [enabled, fetchPresets]);

  const usePreset = useCallback(
    async (presetId: string): Promise<PersonaPresetSnapshot | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const snapshot = await personaPresetApi.use(presetId);
        const now = new Date().toISOString();
        setPresets((prev) =>
          prev.map((preset) =>
            preset.id === presetId
              ? {
                  ...preset,
                  usage_count: preset.usage_count + 1,
                  last_used_at: now,
                }
              : preset,
          ),
        );
        return snapshot;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("personaPresets.useFailed", "Failed to use persona preset"),
        );
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [t],
  );

  const updatePreference = useCallback(
    async (
      presetId: string,
      preference: PersonaPresetPreferenceUpdate,
    ): Promise<PersonaPreset | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await personaPresetApi.updatePreference(
          presetId,
          preference,
        );
        setPresets((prev) =>
          prev.map((preset) => (preset.id === updated.id ? updated : preset)),
        );
        return updated;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t(
                "personaPresets.preferenceFailed",
                "Failed to update persona preference",
              ),
        );
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [t],
  );

  const copyPreset = useCallback(
    async (presetId: string): Promise<PersonaPreset | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const copied = await personaPresetApi.copy(presetId);
        await fetchPresets();
        return copied;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("personaPresets.copyFailed", "Failed to copy persona preset"),
        );
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchPresets, t],
  );

  const createPreset = useCallback(
    async (data: PersonaPresetCreate): Promise<PersonaPreset | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const created = await personaPresetApi.create(data);
        await fetchPresets();
        return created;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t(
                "personaPresets.createFailed",
                "Failed to create persona preset",
              ),
        );
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchPresets, t],
  );

  const updatePreset = useCallback(
    async (
      presetId: string,
      data: PersonaPresetUpdate,
    ): Promise<PersonaPreset | null> => {
      setIsMutating(true);
      setError(null);
      try {
        const updated = await personaPresetApi.update(presetId, data);
        await fetchPresets();
        return updated;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t(
                "personaPresets.updateFailed",
                "Failed to update persona preset",
              ),
        );
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchPresets, t],
  );

  const deletePreset = useCallback(
    async (presetId: string): Promise<boolean> => {
      setIsMutating(true);
      setError(null);
      try {
        await personaPresetApi.delete(presetId);
        await fetchPresets();
        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t(
                "personaPresets.deleteFailed",
                "Failed to delete persona preset",
              ),
        );
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchPresets, t],
  );

  return {
    presets,
    isLoading,
    isMutating,
    error,
    fetchPresets,
    usePreset,
    updatePreference,
    copyPreset,
    createPreset,
    updatePreset,
    deletePreset,
  };
}
