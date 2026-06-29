import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const apiSource = readFileSync(new URL("../api.ts", import.meta.url), "utf8");
const panelSource = readFileSync(new URL("../WorkflowPanel.tsx", import.meta.url), "utf8");

test("Dify workflow frontend exposes paused run resume API contract", () => {
  assert.match(apiSource, /status: "stub" \| "queued" \| "running" \| "paused"/);
  assert.match(apiSource, /pause\?: Record<string, unknown>/);
  assert.match(apiSource, /waiting\?: boolean/);
  assert.match(apiSource, /resumeRun\(/);
  assert.match(apiSource, /\/runs\/\$\{runId\}\/resume/);
});

test("Dify workflow panel renders human approval resume controls", () => {
  assert.match(panelSource, /function HumanApprovalPanel/);
  assert.match(panelSource, /run\?\.status !== "paused"/);
  assert.match(panelSource, /pendingApprovalFromRun/);
  assert.match(panelSource, /onResume\(true\)/);
  assert.match(panelSource, /onResume\(false\)/);
  assert.match(panelSource, /data-testid="dify-workflow-approval-approve"/);
  assert.match(panelSource, /data-testid="dify-workflow-approval-reject"/);
  assert.match(panelSource, /difyWorkflowApi\.resumeRun/);
  assert.match(panelSource, /difyWorkflow\.editor\.toast\.workflowPausedForApproval/);
});

test("Dify workflow frontend exposes pending approval inbox", () => {
  assert.match(apiSource, /export type WorkflowPendingApprovalListResponse/);
  assert.match(apiSource, /pendingApprovals\(/);
  assert.match(apiSource, /\/approvals\/pending/);
  assert.match(panelSource, /function PendingApprovalInbox/);
  assert.match(panelSource, /difyWorkflow\.editor\.approval\.pendingTitle/);
  assert.match(panelSource, /const \[pendingApprovals, setPendingApprovals\]/);
  assert.match(panelSource, /difyWorkflowApi\.pendingApprovals\(0, 20\)/);
  assert.match(panelSource, /const handleSelectPendingApproval/);
  assert.match(panelSource, /difyWorkflowApi\.runEvents\(run\.workflow_id, run\.run_id\)/);
  assert.match(panelSource, /<PendingApprovalInbox/);
});

test("Dify workflow editor can create and configure human approval nodes", () => {
  assert.match(panelSource, /"human_approval"/);
  assert.match(panelSource, /types: \["condition", "human_approval", "question_classifier"/);
  assert.match(panelSource, /if \(type === "human_approval"\)/);
  assert.match(panelSource, /instructions: defaultText\.approveInstruction/);
  assert.match(panelSource, /difyWorkflow\.defaults\.approveInstruction/);
  assert.match(panelSource, /output_key: "approval"/);
  assert.match(panelSource, /selectedNode\.type === "human_approval"/);
  assert.match(panelSource, /difyWorkflow\.editor\.approval\.instructionsTitle/);
  assert.match(panelSource, /patchSelectedNodeData\(\{ instructions: event\.target\.value \}\)/);
  assert.match(panelSource, /difyWorkflow\.editor\.approval\.assigneeTitle/);
  assert.match(panelSource, /patchSelectedNodeData\(\{ assignee: event\.target\.value \}\)/);
  assert.match(panelSource, /difyWorkflow\.editor\.approval\.outputKeyTitle/);
});

test("Dify workflow frontend can run and preflight a selected version", () => {
  assert.match(apiSource, /versionId\?: string \| null/);
  assert.match(apiSource, /version_id: versionId \?\? null/);
  assert.match(panelSource, /const \[selectedVersionId, setSelectedVersionId\]/);
  assert.match(panelSource, /difyWorkflow\.editor\.run\.debugVersion/);
  assert.match(panelSource, /id="dify-workflow-debug-version"/);
  assert.match(panelSource, /function resolveDebugVersionId/);
  assert.match(panelSource, /const nextVersionId = resolveDebugVersionId/);
  assert.match(panelSource, /setSelectedVersionId\(nextVersionId\)/);
  assert.match(panelSource, /selectedVersionId \?\? workflowDetail\?\.latest_version\?\.version_id/);
  assert.match(panelSource, /const handleSelectDebugVersion = async \(versionId: string \| null\)/);
  assert.match(panelSource, /difyWorkflowApi\.inputSchema\(workflowId, nextVersionId\)/);
  assert.match(panelSource, /difyWorkflowApi\.run\([\s\S]*selectedVersionId \?\? workflowDetail\?\.latest_version\?\.version_id/);
  assert.match(panelSource, /data-testid="dify-workflow-import-submit"/);
  assert.match(panelSource, /data-testid="dify-workflow-save-graph"/);
  assert.match(panelSource, /data-testid="dify-workflow-publish-latest"/);
  assert.match(panelSource, /data-testid="dify-workflow-run-mode"/);
  assert.match(panelSource, /data-testid="dify-workflow-run-version"/);
  assert.match(panelSource, /difyWorkflow\.editor\.run\.runVersion/);
});

test("Dify workflow editor exposes a draggable React Flow canvas", () => {
  assert.match(panelSource, /from "@xyflow\/react"/);
  assert.match(panelSource, /function WorkflowCanvas/);
  assert.match(panelSource, /function WorkflowNodePalette/);
  assert.match(panelSource, /WORKFLOW_CANVAS_DRAG_TYPE/);
  assert.match(panelSource, /event\.dataTransfer\.setData\(/);
  assert.match(panelSource, /screenToFlowPosition/);
  assert.match(panelSource, /onAddNodeAt/);
  assert.match(panelSource, /position: position \|\| fallbackWorkflowNodePosition/);
  assert.match(panelSource, /position: node\.position \|\| fallbackWorkflowNodePosition/);
  assert.match(panelSource, /const \[liveNodePositions, setLiveNodePositions\]/);
  assert.match(panelSource, /position: liveNodePositions\[node\.id\] \|\| node\.position \|\| fallbackWorkflowNodePosition\(index\)/);
  assert.match(panelSource, /change\.dragging === false/);
  assert.match(panelSource, /delete next\[change\.id\]/);
  assert.match(panelSource, /delete next\[node\.id\]/);
});

test("Dify workflow editor route can preselect a workflow from the URL", () => {
  assert.match(panelSource, /useParams/);
  assert.match(panelSource, /workflowId: routeWorkflowId/);
  assert.match(panelSource, /const routeSelectedWorkflowId = routeWorkflowId \|\| null/);
  assert.match(panelSource, /useState<string \| null>\(routeSelectedWorkflowId\)/);
  assert.match(panelSource, /routeSelectedWorkflowId && response\.workflows\.some/);
  assert.match(panelSource, /setSelectedId\(routeSelectedWorkflowId\)/);
});

test("Dify workflow run route can hydrate a run trace from the URL", () => {
  assert.match(panelSource, /runId: routeRunId/);
  assert.match(panelSource, /const routeSelectedRunId = routeRunId \|\| null/);
  assert.match(panelSource, /routeSelectedRunId\s*\?\s*await difyWorkflowApi\.runEvents/);
  assert.match(panelSource, /setRunResult\(routeRunEvents\.run\)/);
  assert.match(panelSource, /setRunEvents\(workflowRunEvents\(routeRunEvents\.events\)\)/);
  assert.match(panelSource, /\}, \[defaultText, routeSelectedRunId, selectedId, t\]\)/);
});

test("Dify workflow panel is route-aware across list, editor, and run trace modes", () => {
  assert.match(panelSource, /import \{ Link, useNavigate, useParams, useSearchParams \} from "react-router-dom"/);
  assert.match(panelSource, /function workflowEditorPath/);
  assert.match(panelSource, /function workflowRunTracePath/);
  assert.match(panelSource, /type WorkflowPanelProps/);
  assert.match(panelSource, /export function WorkflowPanel\(\{ activeTab \}: WorkflowPanelProps = \{\}\)/);
  assert.match(panelSource, /const workflowRouteMode = routeSelectedRunId \|\| activeTab === "workflows-run"/);
  assert.match(panelSource, /: routeSelectedWorkflowId \|\| activeTab === "workflows-editor"/);
  assert.match(panelSource, /const workflowRouteTitle = workflowRouteMode === "run"/);
  assert.match(panelSource, /const workspaceGridClass = workflowRouteMode === "run"/);
  assert.match(panelSource, /const shouldShowWorkflowSidebar = workflowRouteMode === "list"/);
  assert.match(panelSource, /shouldShowWorkflowSidebar \? "lg:grid-cols-\[18rem_minmax\(0,1fr\)\]" : ""/);
  assert.match(panelSource, /\{shouldShowWorkflowSidebar && \(/);
  assert.match(panelSource, /workflowRouteMode === "list" &&/);
  assert.match(panelSource, /workflowRouteMode !== "run" &&/);
  assert.match(panelSource, /workflowRouteMode === "run" \? "xl:order-first"/);
  assert.match(panelSource, /to=\{workflowEditorPath\(selectedWorkflow\.workflow_id\)\}/);
  assert.match(panelSource, /to=\{workflowRunTracePath\(runResult\.workflow_id, runResult\.run_id\)\}/);
});

test("Dify workflow run trace renders an event timeline with selected payload details", () => {
  assert.match(panelSource, /const \[selectedEventId, setSelectedEventId\]/);
  assert.match(panelSource, /events\.find\(\(event\) => event\.event_id === selectedEventId\)/);
  assert.match(panelSource, /setSelectedEventId\(event\.event_id\)/);
  assert.match(panelSource, /lg:grid-cols-\[minmax\(0,16rem\)_minmax\(0,1fr\)\]/);
  assert.match(panelSource, /selectedEvent\.payload/);
  assert.match(panelSource, /difyWorkflow\.editor\.events\.selectEvent/);
});

test("Dify workflow list route exposes inventory search filter and editor actions", () => {
  assert.match(panelSource, /type WorkflowStatusFilter = "all" \| WorkflowSummary\["status"\]/);
  assert.match(panelSource, /const \[workflowQuery, setWorkflowQuery\]/);
  assert.match(panelSource, /const \[workflowStatusFilter, setWorkflowStatusFilter\]/);
  assert.match(panelSource, /const \[workflowTotal, setWorkflowTotal\]/);
  assert.match(panelSource, /const hasWorkflowInventoryFilter = workflowQuery\.trim\(\)\.length > 0 \|\| workflowStatusFilter !== "all"/);
  assert.match(panelSource, /difyWorkflowApi\.list\(\{\s+skip: 0,\s+limit: 100,\s+query: workflowQuery,\s+status: workflowStatusFilter,/);
  assert.match(panelSource, /setWorkflowTotal\(response\.total\)/);
  assert.match(panelSource, /difyWorkflow\.editor\.inventory\.title/);
  assert.match(panelSource, /difyWorkflow\.editor\.inventory\.searchPlaceholder/);
  assert.match(panelSource, /difyWorkflow\.editor\.inventory\.allStatuses/);
  assert.match(panelSource, /difyWorkflow\.editor\.inventory\.noMatchingWorkflows/);
  assert.match(panelSource, /to=\{workflowEditorPath\(workflow\.workflow_id\)\}/);
});

test("Dify workflow panel displays workflow input and output contract", () => {
  assert.match(apiSource, /export type WorkflowIoContractResponse/);
  assert.match(apiSource, /output_schema: Record<string, unknown>/);
  assert.match(apiSource, /output_contract\?:/);
  assert.match(apiSource, /missing_required\?: string\[\]/);
  assert.match(apiSource, /type_mismatches\?: Array<Record<string, unknown>>/);
  assert.match(apiSource, /ioContract\(/);
  assert.ok(apiSource.includes("/io-contract"));
  assert.match(panelSource, /type WorkflowIoContractResponse/);
  assert.match(panelSource, /const \[ioContract, setIoContract\]/);
  assert.match(panelSource, /const outputFields = useMemo/);
  assert.match(panelSource, /difyWorkflowApi\.ioContract\(workflowId, nextVersionId\)/);
  assert.match(panelSource, /difyWorkflowApi\.ioContract\(workflowId, resolvedVersionId\)/);
  assert.match(panelSource, /difyWorkflow\.editor\.run\.outputContract/);
  assert.match(panelSource, /ioContract\.output_schema_source/);
  assert.match(panelSource, /difyWorkflow\.editor\.run\.outputSchemaUnavailable/);
});

test("Dify workflow input option supports chat session and scheduled task payloads", () => {
  const optionSource = readFileSync(new URL("../WorkflowSelectOption.tsx", import.meta.url), "utf8");
  assert.match(optionSource, /SELECTED_WORKFLOW_INPUT_JSON: "SELECTED_WORKFLOW_ID"/);
  assert.match(optionSource, /SELECTED_WORKFLOW_INPUT_JSON: "SELECTED_WORKFLOW_VERSION_ID"/);
  assert.match(optionSource, /workflowInputOptionWorkflowId\(option\?\.key, pluginValues\)/);
  assert.match(optionSource, /workflowInputOptionVersionId\(option\?\.key, pluginValues\)/);
});

test("Dify workflow run views display output contract status", () => {
  assert.match(panelSource, /type WorkflowRunOutputContractStatus/);
  assert.match(panelSource, /function workflowRunOutputContractStatus/);
  assert.match(panelSource, /run\?\.output_contract/);
  assert.match(panelSource, /difyWorkflow\.editor\.run\.outputContractStatus\.ok/);
  assert.match(panelSource, /difyWorkflow\.editor\.run\.outputContractStatus\.issue/);
  assert.match(panelSource, /missing_required/);
  assert.match(panelSource, /type_mismatches/);
  assert.match(panelSource, /detail: contract\.valid \? "" : titleParts\.join\(" \| "\)/);
  assert.match(panelSource, /outputContract\?\.detail/);
  assert.match(panelSource, /workflowRunOutputContractBadgeClass/);
  assert.match(panelSource, /workflowRunOutputContractStatus\(run, outputContractStatusLabels\)/);
  assert.match(panelSource, /workflowRunOutputContractStatus\(runResult, outputContractStatusLabels\)/);
});

test("Dify workflow editor exposes grouped searchable node palette and canvas actions", () => {
  assert.match(panelSource, /const WORKFLOW_NODE_PALETTE_GROUPS/);
  assert.match(panelSource, /function workflowNodePaletteGroups/);
  assert.match(panelSource, /const \[paletteQuery, setPaletteQuery\]/);
  assert.match(panelSource, /difyWorkflow\.editor\.palette\.searchPlaceholder/);
  assert.match(panelSource, /difyWorkflow\.editor\.palette\.noMatches/);
  assert.match(panelSource, /onAddNode\(type, undefined, presetId\)/);
  assert.match(panelSource, /handleFitView/);
  assert.match(panelSource, /fitView\(\{ duration: 250, padding: 0\.2 \}\)/);
  assert.match(panelSource, /handleCenterSelected/);
  assert.match(panelSource, /setCenter\(/);
  assert.match(panelSource, /style=\{\{ height: "28rem", minHeight: "20rem" \}\}/);
  assert.match(panelSource, /className="h-full w-full"/);
  assert.match(panelSource, /data-testid="dify-workflow-canvas"/);
  assert.match(panelSource, /data-testid="dify-workflow-react-flow"/);
  assert.match(panelSource, /data-testid="dify-workflow-node-palette"/);
  assert.match(panelSource, /data-testid=\{`dify-workflow-node-palette-item-\$\{type\}`\}/);
  assert.match(panelSource, /data-testid=\{`dify-workflow-node-add-\$\{type\}`\}/);
  assert.match(panelSource, /difyWorkflow\.editor\.canvas\.fitView/);
  assert.match(panelSource, /difyWorkflow\.editor\.canvas\.centerSelected/);
});

test("Dify workflow run trace can focus events by selected workflow node", () => {
  assert.match(panelSource, /function runEventNodeIds/);
  assert.match(panelSource, /focusedNodeId\?: string \| null/);
  assert.match(panelSource, /const visibleEvents = useMemo/);
  assert.match(panelSource, /event\.node_id === focusedNodeId/);
  assert.match(panelSource, /difyWorkflow\.editor\.events\.all/);
  assert.match(panelSource, /difyWorkflow\.editor\.events\.emptySelected/);
  assert.match(panelSource, /const \[runEventFocusedNodeId, setRunEventFocusedNodeId\]/);
  assert.match(panelSource, /setRunEventFocusedNodeId\(nodeId\)/);
  assert.match(panelSource, /const handleFocusRunEventNode/);
  assert.match(panelSource, /focusedNodeId=\{runEventFocusedNodeId\}/);
  assert.match(panelSource, /onFocusNode=\{handleFocusRunEventNode\}/);
});

test("Dify workflow canvas highlights node execution state from run events", () => {
  assert.match(panelSource, /type WorkflowNodeRunStatus = "idle" \| "running" \| "succeeded" \| "failed" \| "paused"/);
  assert.match(panelSource, /function workflowNodeRunStates/);
  assert.match(panelSource, /workflowNodeRunStatusFromEvents/);
  assert.match(panelSource, /emptyWorkflowNodeRunState\(true\)/);
  assert.match(panelSource, /function workflowNodeRunStateClass/);
  assert.match(panelSource, /function workflowNodeRunStatusClass/);
  assert.match(panelSource, /runState\?: WorkflowNodeRunState/);
  assert.match(panelSource, /nodeRunStates: Record<string, WorkflowNodeRunState>/);
  assert.match(panelSource, /workflowCanvasNodes\(graph, selectedNodeId, nodeRunStates, liveNodePositions\)/);
  assert.match(panelSource, /const nodeRunStates = useMemo/);
  assert.match(panelSource, /nodeRunStates=\{nodeRunStates\}/);
  assert.match(panelSource, /runState\.eventCount/);
  assert.match(panelSource, /runState\.lastEventType/);
  assert.match(panelSource, /data-testid=\{`dify-workflow-canvas-run-status-\$\{data\.nodeId\}`\}/);
});
