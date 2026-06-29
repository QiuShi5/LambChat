import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectPluginLocaleResources,
  mergeLocaleResource,
} from "../pluginLocales";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../../..");

test("plugin locale loader uses a direct literal glob for Vite production builds", () => {
  const source = readFileSync(resolve(currentDir, "../pluginLocales.ts"), "utf8");

  assert.doesNotMatch(source, /const\s+\w+\s*=\s*import\.meta\.glob/);
  assert.match(source, /import\.meta\.glob<PluginLocaleResource>\(\s*\[/);
  assert.match(source, /"\.\.\/\.\.\/\.\.\/plugins\/system\/\*\/frontend\/locales\/\*\.json"/);
  assert.match(source, /"\.\.\/\.\.\/\.\.\/plugins\/preinstalled\/\*\/frontend\/locales\/\*\.json"/);
});

test("plugin locale resources are collected by language and deeply merged", () => {
  const resources = collectPluginLocaleResources({
    "../../../plugins/system/dify_workflow/frontend/locales/en.json": {
      difyWorkflow: { nav: { label: "Workflows" } },
    },
    "../../../plugins/system/dify_workflow/frontend/locales/zh.json": {
      default: {
        difyWorkflow: {
          nav: { label: "工作流" },
          editor: { graph: { title: "图编辑器" } },
        },
      },
    },
    "../../../plugins/system/dify_workflow/frontend/locales/fr.json": {
      difyWorkflow: { nav: { label: "Flux" } },
    },
    "../../../plugins/system/dify_workflow/frontend/not-locales/en.json": {
      difyWorkflow: { nav: { label: "Ignored" } },
    },
  });

  assert.deepEqual(resources.en, {
    difyWorkflow: { nav: { label: "Workflows" } },
  });
  assert.deepEqual(resources.zh, {
    difyWorkflow: {
      nav: { label: "工作流" },
      editor: { graph: { title: "图编辑器" } },
    },
  });
  assert.equal(resources.fr, undefined);
});

test("plugin locale resources override base locale keys while preserving siblings", () => {
  assert.deepEqual(
    mergeLocaleResource(
      { difyWorkflow: { nav: { label: "Base" }, chat: { selectWorkflow: "Workflow" } } },
      { difyWorkflow: { nav: { label: "Plugin" } } },
    ),
    {
      difyWorkflow: {
        nav: { label: "Plugin" },
        chat: { selectWorkflow: "Workflow" },
      },
    },
  );
});

test("dify workflow plugin ships locale files for every supported app language", () => {
  const pluginLocalesDir = resolve(
    repoRoot,
    "plugins",
    "system",
    "dify_workflow",
    "frontend",
    "locales",
  );
  for (const language of ["en", "zh", "ja", "ko", "ru"]) {
    const locale = JSON.parse(
      readFileSync(resolve(pluginLocalesDir, `${language}.json`), "utf8"),
    );
    assert.equal(typeof locale.difyWorkflow.nav.label, "string");
    assert.equal(typeof locale.difyWorkflow.editor.graph.title, "string");
    assert.equal(typeof locale.difyWorkflow.editor.route.listTitle, "string");
    assert.equal(typeof locale.difyWorkflow.editor.toolbar.newWorkflow, "string");
    assert.equal(typeof locale.difyWorkflow.editor.inventory.noWorkflows, "string");
    assert.equal(typeof locale.difyWorkflow.editor.import.dryRun, "string");
    assert.equal(typeof locale.difyWorkflow.editor.delete.action, "string");
    assert.equal(typeof locale.difyWorkflow.editor.run.workflowInterface, "string");
    assert.equal(typeof locale.difyWorkflow.editor.run.runVersion, "string");
    assert.equal(typeof locale.difyWorkflow.editor.toast.workflowDeleted, "string");
    assert.equal(typeof locale.difyWorkflow.editor.toast.workflowImported, "string");
    assert.equal(typeof locale.difyWorkflow.editor.toast.workflowRunCompleted, "string");
    assert.equal(typeof locale.difyWorkflow.editor.run.outputContractStatus.satisfied, "string");
    assert.equal(typeof locale.difyWorkflow.plugin.name, "string");
    assert.equal(typeof locale.difyWorkflow.plugin.description, "string");
    assert.equal(typeof locale.difyWorkflow.defaults.importedWorkflowName, "string");
    assert.equal(typeof locale.difyWorkflow.defaults.entryMessageDescription, "string");
    assert.equal(typeof locale.difyWorkflow.validation.invalidJson, "string");
    assert.equal(typeof locale.difyWorkflow.validation.inputObjectRequired, "string");
    assert.equal(typeof locale.pluginSettings.dify_workflow.DEFAULT_MODEL.label, "string");
    assert.equal(typeof locale.pluginSettings.dify_workflow.DEFAULT_MODEL.description, "string");
    assert.equal(typeof locale.pluginSettings.dify_workflow.RUN_LOG_RETENTION_DAYS.description, "string");
  }
});
