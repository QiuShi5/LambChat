# Demo Notes Plugin Example

This page preserves the former `demo/demo_notes` package as documentation. It is meant as a copyable design reference for local plugin packages, not as a preinstalled runtime package in this repository.

The example shows how a folder-style plugin can declare backend routes, agent tools, frontend contribution points, settings, default plugin data, and resource ownership for import dry-runs.

## Package Layout

```text
demo_notes/
  README.md
  plugin.yaml
  backend/
    __init__.py
    lifecycle.py
    plugin.json
    routes.py
    tools.py
  frontend/
    plugin.json
  config/
    defaults.json
    schema.json
  resources/
    resources.yaml
  plugin-data-template/
    config/
      current.json
      defaults.json
```

When packaging this example, the archive should contain exactly one top-level directory named `demo_notes`.

## Capabilities

- Plugin settings schema.
- Backend API prefix: `/api/demo-notes`.
- Agent tool: `demo_notes_create_note`.
- Frontend app tab and panel.
- Assistant message action.
- Tool result renderer declaration.
- Resource ownership and dry-run policy.
- Default runtime data through `plugin-data-template/`.

## `plugin.yaml`

```yaml
id: demo_notes
name: Demo Notes
version: 1.0.0
api_version: v1
install_type: preinstalled
entrypoint: backend
permissions:
  - demo_notes:read
  - demo_notes:write
enabled_by_default: false
settings:
  - key: NOTEBOOK_NAME
    type: string
    label: pluginSettings.demo_notes.NOTEBOOK_NAME.label
    description: pluginSettings.demo_notes.NOTEBOOK_NAME.description
    default: Inbox
    scope: system
    group: general
    order: 10
  - key: ALLOW_MESSAGE_ACTION
    type: boolean
    label: pluginSettings.demo_notes.ALLOW_MESSAGE_ACTION.label
    description: pluginSettings.demo_notes.ALLOW_MESSAGE_ACTION.description
    default: true
    scope: system
    group: behavior
    order: 20
  - key: MAX_NOTE_LENGTH
    type: number
    label: pluginSettings.demo_notes.MAX_NOTE_LENGTH.label
    description: pluginSettings.demo_notes.MAX_NOTE_LENGTH.description
    default: 2000
    scope: system
    group: limits
    order: 30
data_template: plugin-data-template
```

## Backend Manifest

```json
{
  "schema": "lambchat.plugin.backend.v1",
  "plugin_id": "demo_notes",
  "backend": {
    "routes": [
      {
        "name": "demo_notes-api",
        "prefix": "/api/demo-notes",
        "module": "plugins.installed.demo_notes.backend.routes",
        "required_permissions": ["demo_notes:read", "demo_notes:write"],
        "tags": ["Demo Notes"]
      }
    ],
    "tools": [
      {
        "name": "demo_notes_create_note",
        "module": "plugins.installed.demo_notes.backend.tools",
        "required_permissions": ["demo_notes:write"],
        "legacy_ids": ["demo_notes.create_note"]
      }
    ],
    "lifespan_hooks": [
      {
        "name": "demo_notes:shutdown",
        "module": "plugins.installed.demo_notes.backend.lifecycle:close_demo_notes",
        "phase": "shutdown",
        "order": 50
      }
    ]
  }
}
```

## Frontend Manifest

```json
{
  "schema": "lambchat.plugin.frontend.v1",
  "plugin_id": "demo_notes",
  "frontend": {
    "app_tabs": [
      {
        "id": "demo_notes:notes-tab",
        "tab": "demo-notes",
        "path": "/demo-notes",
        "label": "demoNotes.nav.label",
        "panel": "demo_notes:notes-panel",
        "insert_after": "settings",
        "order": 650,
        "permissions": ["demo_notes:read"],
        "seo_title": "demoNotes.seo.title",
        "seo_description": "demoNotes.seo.description"
      }
    ],
    "app_panels": [
      {
        "id": "demo_notes:notes-panel",
        "tab": "demo-notes",
        "renderer": "demo_notes.NotesPanel"
      }
    ],
    "message_actions": [
      {
        "id": "demo_notes:save-message-note",
        "target": "assistant_message",
        "renderer": "demo_notes.SaveMessageNoteButton",
        "order": 40,
        "permissions": ["demo_notes:write"]
      }
    ],
    "tool_renderers": [
      {
        "id": "demo_notes:create-note-renderer",
        "tool_names": ["demo_notes.demo_notes_create_note", "demo_notes_create_note"]
      }
    ],
    "i18n_namespaces": ["demo_notes"],
    "required_permissions": ["demo_notes:read"]
  }
}
```

## Settings Data

`config/schema.json`:

```json
{
  "settings": [
    {
      "key": "NOTEBOOK_NAME",
      "type": "string",
      "label": "pluginSettings.demo_notes.NOTEBOOK_NAME.label",
      "description": "pluginSettings.demo_notes.NOTEBOOK_NAME.description",
      "default": "Inbox",
      "scope": "system",
      "group": "general",
      "order": 10
    },
    {
      "key": "ALLOW_MESSAGE_ACTION",
      "type": "boolean",
      "label": "pluginSettings.demo_notes.ALLOW_MESSAGE_ACTION.label",
      "description": "pluginSettings.demo_notes.ALLOW_MESSAGE_ACTION.description",
      "default": true,
      "scope": "system",
      "group": "behavior",
      "order": 20
    },
    {
      "key": "MAX_NOTE_LENGTH",
      "type": "number",
      "label": "pluginSettings.demo_notes.MAX_NOTE_LENGTH.label",
      "description": "pluginSettings.demo_notes.MAX_NOTE_LENGTH.description",
      "default": 2000,
      "scope": "system",
      "group": "limits",
      "order": 30
    }
  ]
}
```

`config/defaults.json`:

```json
{
  "NOTEBOOK_NAME": "Inbox",
  "ALLOW_MESSAGE_ACTION": true,
  "MAX_NOTE_LENGTH": 2000
}
```

The same defaults can be placed under `plugin-data-template/config/defaults.json` and `plugin-data-template/config/current.json`.

## Resource Ownership

```yaml
resources:
  - id: demo_notes:save-message-note
    type: message_action
    scope: session
    retention_policy: keep_user_data
    cleanup_strategy: keep
    metadata:
      renderer: demo_notes.SaveMessageNoteButton
      purpose: Save an assistant message as a note.
  - id: demo_notes
    type: db_collection
    scope: global
    retention_policy: keep_user_data
    cleanup_strategy: keep
    metadata:
      storage: mongodb
      purpose: Notes created by the Demo Notes plugin.
  - id: demo_notes.user_created_at
    type: db_index
    scope: global
    retention_policy: archive_metadata
    cleanup_strategy: archive
    metadata:
      collection: demo_notes
      fields: user_id,created_at:-1
  - id: plugin-data/demo_notes
    type: plugin_data_folder
    scope: system
    retention_policy: keep_user_data
    cleanup_strategy: keep
    metadata:
      storage: local_filesystem
      purpose: Demo Notes runtime data directory.
  - id: plugin-data/demo_notes/config/current.json
    type: plugin_data_config
    scope: system
    retention_policy: keep_user_data
    cleanup_strategy: keep
    metadata:
      source: plugin-data-template/config/current.json
      purpose: Current plugin data-backed defaults.
  - id: DEMO_NOTES_API_KEY
    type: env_key_declaration
    scope: system
    retention_policy: keep_user_data
    cleanup_strategy: keep
    metadata:
      setting: API_KEY
      secret: "true"
      purpose: Optional env fallback for first import only.
```

Use `keep_user_data` for user-created content and `archive_metadata` for indexes or metadata that can be rebuilt.

## Import Flow

1. Copy the layout above into a local `demo_notes/` directory.
2. Package the folder as `.zip`, `.tar`, `.tar.gz`, or `.tgz`, or import the folder path directly.
3. Open Extension Center / Plugins.
4. Use Import local plugin package.
5. Run Dry Run first and inspect actions, warnings, `sha256`, target path, and data directory.
6. Import the package.
7. Restart or rescan plugin packages before enabling the plugin.

Typical installed locations:

```text
plugins/installed/demo_notes/
plugin-data/demo_notes/
```

## Delivery Checklist

- `plugin.yaml` exists and `id` matches the folder name.
- `backend/plugin.json` and `frontend/plugin.json` use the same `plugin_id`.
- `config/schema.json` and defaults are valid JSON.
- `resources/resources.yaml` declares data, settings, UI, tools, routes, indexes, and environment keys.
- `plugin-data-template/` contains no secrets.
- The package has no symlink, `.git/`, `.env`, `node_modules/`, `.venv/`, `__pycache__/`, or generated cache directories.
- Dry-run import succeeds before enabling the plugin.
