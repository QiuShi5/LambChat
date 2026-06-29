from src.kernel.extensions import (
    DIFY_WORKFLOW_PLUGIN_ID,
    PluginResourceType,
    PluginRuntime,
    build_dify_workflow_plugin_manifest,
)
from src.kernel.types import Permission


def _dify_workflow_manifest():
    return build_dify_workflow_plugin_manifest()


def test_dify_workflow_manifest_declares_agent_team_sibling_app_entry() -> None:
    manifest = _dify_workflow_manifest()

    assert manifest.name == "difyWorkflow.plugin.name"
    assert manifest.description == "difyWorkflow.plugin.description"

    tabs = {tab.tab: tab for tab in manifest.frontend.app_tabs}
    panels = {panel.tab: panel for panel in manifest.frontend.app_panels}

    assert list(tabs) == ["workflows", "workflows-editor", "workflows-run"]
    assert tabs["workflows"].id == "dify_workflow:workflows-tab"
    assert tabs["workflows"].path == "/workflows"
    assert tabs["workflows"].panel == "dify_workflow:workflows-panel"
    assert tabs["workflows"].insert_after == "agent-team"
    assert tabs["workflows"].permissions == [Permission.WORKFLOW_READ.value]
    assert tabs["workflows-editor"].path == "/workflows/:workflowId/editor"
    assert tabs["workflows-editor"].panel == "dify_workflow:workflow-editor-panel"
    assert tabs["workflows-editor"].insert_after == "workflows"
    assert tabs["workflows-run"].path == "/workflows/:workflowId/runs/:runId"
    assert tabs["workflows-run"].panel == "dify_workflow:workflow-run-panel"
    assert tabs["workflows-run"].insert_after == "workflows-editor"

    assert panels["workflows"].renderer == "dify_workflow.WorkflowPanel"
    assert panels["workflows-editor"].renderer == "dify_workflow.WorkflowPanel"
    assert panels["workflows-run"].renderer == "dify_workflow.WorkflowPanel"

    assert manifest.frontend.sidebar_items[0].id == "dify_workflow:workflows-nav"
    assert manifest.frontend.sidebar_items[0].path == "/workflows"
    assert manifest.frontend.sidebar_items[0].icon == "Workflow"
    assert manifest.frontend.sidebar_items[0].permissions == [
        Permission.WORKFLOW_READ.value
    ]


def test_dify_workflow_manifest_declares_workflow_owned_call_boundaries() -> None:
    manifest = _dify_workflow_manifest()

    tools = {tool.name: tool for tool in manifest.tools}
    assert list(tools) == [
        "dify_workflow_run",
        "dify_workflow_list",
        "dify_workflow_get_schema",
        "dify_workflow_get_run",
        "dify_workflow_resume",
    ]
    assert tools["dify_workflow_run"].required_permissions == [
        Permission.WORKFLOW_RUN.value
    ]
    assert tools["dify_workflow_run"].legacy_ids == ["workflow_run"]
    assert tools["dify_workflow_list"].legacy_ids == ["workflow_list"]
    assert tools["dify_workflow_get_schema"].legacy_ids == ["workflow_get_schema"]
    assert tools["dify_workflow_get_run"].legacy_ids == ["workflow_get_run"]
    assert tools["dify_workflow_resume"].required_permissions == [
        Permission.WORKFLOW_RUN.value
    ]
    assert tools["dify_workflow_resume"].legacy_ids == ["workflow_resume"]
    assert manifest.routers[0].tags == ["difyWorkflow.nav.label"]

    chat_option = manifest.frontend.chat_input_options[0]
    chat_panel = manifest.frontend.chat_input_panels[0]
    assert chat_option.id == "dify_workflow:select-workflow"
    assert chat_option.panel == "dify_workflow:workflow-picker"
    assert chat_option.selected_renderer == "dify_workflow.SelectedWorkflowChip"
    assert chat_option.shortcut == "mod+w"
    assert chat_option.option_binding is not None
    assert chat_option.option_binding.plugin_id == DIFY_WORKFLOW_PLUGIN_ID
    assert chat_option.option_binding.key == "SELECTED_WORKFLOW_ID"
    assert chat_option.option_binding.scope == "session"
    assert chat_panel.id == "dify_workflow:workflow-picker"
    assert chat_panel.renderer == "dify_workflow.WorkflowPickerModal"
    assert chat_panel.create_path == "/workflows?create=blank"
    assert chat_panel.manage_path == "/workflows"


def test_dify_workflow_manifest_declares_storage_indexes_created_at_startup() -> None:
    runtime = PluginRuntime([build_dify_workflow_plugin_manifest()])

    indexes_by_id = {
        resource.resource_id: resource.metadata
        for resource in runtime.resource_ledger.list(
            plugin_id=DIFY_WORKFLOW_PLUGIN_ID,
            resource_type=PluginResourceType.DB_INDEX,
        )
    }

    assert indexes_by_id == {
        "dify_workflow_definitions.workflow_id_unique": {
            "collection": "dify_workflow_definitions",
            "fields": "workflow_id",
            "unique": "true",
        },
        "dify_workflow_definitions.owner_updated_at_lookup": {
            "collection": "dify_workflow_definitions",
            "fields": "owner_user_id,updated_at:-1",
        },
        "dify_workflow_versions.version_id_unique": {
            "collection": "dify_workflow_versions",
            "fields": "version_id",
            "unique": "true",
        },
        "dify_workflow_versions.workflow_version_lookup": {
            "collection": "dify_workflow_versions",
            "fields": "workflow_id,version_number",
        },
        "dify_workflow_runs.run_id_unique": {
            "collection": "dify_workflow_runs",
            "fields": "run_id",
            "unique": "true",
        },
        "dify_workflow_runs.workflow_started_at_lookup": {
            "collection": "dify_workflow_runs",
            "fields": "workflow_id,started_at:-1",
        },
        "dify_workflow_run_events.run_sequence_lookup": {
            "collection": "dify_workflow_run_events",
            "fields": "run_id,sequence",
        },
        "dify_workflow_credentials.credential_id_unique": {
            "collection": "dify_workflow_credentials",
            "fields": "credential_id",
            "unique": "true",
        },
        "dify_workflow_credentials.owner_ref_unique": {
            "collection": "dify_workflow_credentials",
            "fields": "owner_user_id,ref",
            "unique": "true",
        },
        "dify_workflow_credentials.owner_updated_at_lookup": {
            "collection": "dify_workflow_credentials",
            "fields": "owner_user_id,updated_at:-1",
        },
    }
