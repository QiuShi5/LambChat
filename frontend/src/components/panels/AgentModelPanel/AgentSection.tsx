/**
 * Agent 配置区块（嵌入统一面板内，不再自带外壳）
 */

import { useState, useEffect, useCallback } from "react";
import { Bot, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { AgentPanelSkeleton } from "../../skeletons";
import { agentConfigApi, roleApi, agentApi } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { Permission } from "../../../types";
import type { AgentConfig, Role, AgentInfo } from "../../../types";

import { GlobalAgentTab, RolesAgentTab } from "../AgentPanel/tabs";

type AgentTabType = "global" | "roles";

export function AgentSection() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManageAgents = hasPermission(Permission.AGENT_ADMIN);
  const [activeTab, setActiveTab] = useState<AgentTabType>("global");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [globalAgents, setGlobalAgents] = useState<AgentConfig[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleAgentsMap, setRoleAgentsMap] = useState<Record<string, string[]>>(
    {},
  );
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [globalConfig, roleList, agentList] = await Promise.all([
        canManageAgents
          ? agentConfigApi.getGlobalConfig()
          : Promise.resolve(null),
        roleApi.list({ limit: 200 }),
        agentApi.list(),
      ]);

      setAvailableAgents(
        canManageAgents && globalConfig
          ? globalConfig.agents.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              version: "",
            }))
          : agentList.agents || [],
      );

      if (globalConfig) {
        setGlobalAgents(globalConfig.agents || []);
      } else {
        setGlobalAgents(
          (agentList.agents || []).map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            enabled: true,
          })),
        );
      }

      setRoles(roleList.roles || []);

      if (canManageAgents) {
        const roleAgentPromises = (roleList.roles || []).map(async (role) => {
          try {
            const assignment = await agentConfigApi.getRoleAgents(role.id);
            return { roleId: role.id, agents: assignment.allowed_agents };
          } catch {
            return { roleId: role.id, agents: [] };
          }
        });
        const roleAgentResults = await Promise.all(roleAgentPromises);
        const map: Record<string, string[]> = {};
        roleAgentResults.forEach(({ roleId, agents }) => {
          map[roleId] = agents;
        });
        setRoleAgentsMap(map);
      }
    } catch (err) {
      const errorMsg = (err as Error).message || t("agentConfig.loadFailed");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [canManageAgents, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateGlobalConfig = async (agents: AgentConfig[]) => {
    if (!canManageAgents) return;
    setIsSaving(true);
    try {
      await agentConfigApi.updateGlobalConfig(agents);
      setGlobalAgents(agents);
      toast.success(t("agentConfig.saveSuccess"));
    } catch (err) {
      toast.error((err as Error).message || t("agentConfig.saveFailed"));
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRoleAgents = async (roleId: string, agentIds: string[]) => {
    if (!canManageAgents) return;
    try {
      await agentConfigApi.updateRoleAgents(roleId, agentIds);
      setRoleAgentsMap((prev) => ({ ...prev, [roleId]: agentIds }));
      toast.success(t("agentConfig.saveSuccess"));
    } catch (err) {
      toast.error((err as Error).message || t("agentConfig.saveFailed"));
      throw err;
    }
  };

  if (isLoading) {
    return <AgentPanelSkeleton />;
  }

  const enabledGlobalAgents = globalAgents.filter(
    (agent) => agent.enabled,
  ).length;
  const overviewItems = [
    { value: availableAgents.length, label: t("agentConfig.availableAgents") },
    {
      value: enabledGlobalAgents,
      label: t("agentConfig.agentsEnabled", { count: enabledGlobalAgents }),
    },
    { value: roles.length, label: t("agentConfig.rolesTab") },
  ];

  return (
    <div className="animate-glass-enter px-4 py-5 sm:px-6 lg:px-7">
      {error && (
        <div className="glass-card mb-4 flex items-center gap-2 rounded-xl p-3 text-sm text-red-600 !border-red-200/40 dark:text-red-400 dark:!border-red-800/30">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {overviewItems.map((item) => (
          <div
            key={item.label}
            className="glass-card animate-glass-enter rounded-xl px-4 py-3.5"
          >
            <div className="text-xl font-bold tracking-tight text-theme-text">
              {item.value}
            </div>
            <div className="mt-0.5 truncate text-xs text-theme-text-secondary">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {canManageAgents && (
        <div className="glass-tab-bar mb-5 flex gap-6">
          <button
            onClick={() => setActiveTab("global")}
            className={`glass-tab-active px-1 pb-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === "global"
                ? "text-theme-text"
                : "text-theme-text-secondary hover:text-theme-text"
            }`}
          >
            {t("agentConfig.globalTab")}
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`glass-tab-active px-1 pb-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === "roles"
                ? "text-theme-text"
                : "text-theme-text-secondary hover:text-theme-text"
            }`}
          >
            {t("agentConfig.rolesTab")}
          </button>
        </div>
      )}

      {canManageAgents ? (
        activeTab === "global" ? (
          <GlobalAgentTab
            agents={globalAgents}
            onUpdate={handleUpdateGlobalConfig}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        ) : (
          <RolesAgentTab
            roles={roles}
            roleAgentsMap={roleAgentsMap}
            availableAgents={availableAgents}
            onUpdate={handleUpdateRoleAgents}
            isLoading={isLoading}
          />
        )
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-theme-text-secondary px-1 leading-relaxed hidden sm:block">
            {t("agentConfig.availableAgents")}
          </p>
          <div className="glass-card divide-y divide-[var(--glass-border)] overflow-hidden rounded-xl">
            {availableAgents.map((agent, index) => (
              <div
                key={agent.id}
                className="flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-[var(--glass-bg-hover)]"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--glass-bg-subtle)] text-theme-text-secondary ring-1 ring-[var(--glass-border)]">
                  <Bot size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-theme-text tracking-tight">
                    {t(agent.name)}
                  </h4>
                  <p className="mt-0.5 hidden truncate text-xs text-theme-text-secondary sm:block">
                    {t(agent.description)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
