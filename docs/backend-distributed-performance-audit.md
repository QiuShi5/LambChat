# Backend Distributed and Performance Audit

Date: 2026-06-11

Scope: FastAPI backend runtime, chat task execution, Redis/arq queueing, MongoDB event persistence, WebSocket delivery, scheduler, upload storage, and deployment defaults.

## Executive Summary

The backend already uses Redis, MongoDB, arq, Redis Streams, and distributed scheduler locks, so it is close to multi-replica capable. The remaining gaps are mostly in boundary paths where process-local state still drives behavior after a request leaves the original API process.

The most important defect is queued chat dispatch: direct chat submissions use arq when `TASK_BACKEND=arq`, but a queued chat run is still dequeued and executed with `asyncio.create_task()` inside whichever API process releases the previous concurrency slot. That bypasses the distributed task backend and weakens restart, isolation, and worker lifecycle guarantees.

The second hard defect is secret stability. `JWT_SECRET_KEY` and `MCP_ENCRYPTION_SALT` are randomly generated when missing. That is acceptable for a local single process, but in a multi-replica deployment it causes tokens and encrypted MCP configuration to be instance-dependent.

## Findings

### P0: Queued chat runs bypass arq after dequeue

Status: fixed in `src/infra/task/concurrency.py`.

Evidence:
- Direct chat submission in `src/api/routes/chat.py` calls `BackgroundTaskManager.submit_arq()` when `settings.TASK_BACKEND == "arq"`.
- Queued tasks are stored in Redis by `src/infra/task/concurrency.py`.
- When a slot is released, `_dispatch_queued_task()` creates a local `asyncio.create_task()` and registers it in the releasing process.

Impact:
- Queued tasks execute in API pods instead of the configured arq execution backend.
- A queued run can be tied to the lifecycle of an arbitrary API instance.
- Operational tuning of arq worker concurrency does not apply to dequeued queued runs.
- Multi-replica behavior is inconsistent between non-queued and queued chat runs.

Fix:
- Change queued dispatch to call `BackgroundTaskManager.submit_arq()` when `TASK_BACKEND=arq`.
- Preserve existing local execution for `TASK_BACKEND=local`.
- Keep the Redis concurrency slot already acquired by dequeue; do not reacquire it.
- Ensure queued task payload includes `display_message`, `trace_id`, `user_message_written`, `recommendation_input`, `team_id`, and `active_goal`.

Verification:
- Added `tests/infra/task/test_concurrency_queue.py::test_dispatch_queued_task_uses_arq_backend_without_local_task`.
- Existing local-backend queued dispatch path remains covered by the queue tests.

### P0: Runtime secrets are generated per process when unset

Status: fixed with distributed-mode startup validation.

Evidence:
- `src/kernel/config/base.py` uses `default_factory` and post-init generation for `JWT_SECRET_KEY`.
- `MCP_ENCRYPTION_SALT` is generated when absent.
- Kubernetes docs set both from secrets, but Docker/local defaults still allow random values.

Impact:
- In multi-replica deployments, JWTs issued or verified by different pods can fail.
- Encrypted MCP configuration can become unreadable across pods.
- Rolling restarts can invalidate sessions and saved secrets unexpectedly.

Fix:
- Add a startup/runtime validation helper that rejects multi-replica/distributed production configuration when stable `JWT_SECRET_KEY` or `MCP_ENCRYPTION_SALT` is missing.
- Keep local development behavior intact.
- Document the required environment variables for any multi-replica deployment.

Verification:
- Added `src/infra/distributed_validation.py`.
- API startup calls `validate_distributed_runtime_settings()`.
- arq worker startup calls the same validation hook.
- Added tests in `tests/infra/test_distributed_validation.py`, `tests/kernel/config/test_secret_expansion.py`, and `tests/infra/task/test_arq_worker.py`.

### P1: Kubernetes arq topology must be explicit

Status: fixed in `k8s/lambchat.yaml` and deployment docs.

Evidence:
- Multi-replica deployments can run either symmetric API pods with `ARQ_EMBEDDED_WORKER=true`, or API pods plus dedicated arq worker pods.
- The important invariant is that chat submission, queued dispatch, cancellation, and concurrency slots stay coordinated through Redis/MongoDB.

Impact:
- If the topology is not explicit, operators may scale API request capacity and task execution capacity unintentionally.
- If queued dispatch bypasses arq, embedded or dedicated workers both lose consistent distributed behavior.

Fix:
- Keep the default Kubernetes manifest as symmetric nodes: every `lambchat` pod has one embedded arq worker.
- Document dedicated arq worker pods as an optional resource-isolation topology.
- Ensure queued chat dispatch remains on arq in either topology.

Verification:
- API Deployment sets `ARQ_EMBEDDED_WORKER=true` and `LAMBCHAT_DISTRIBUTED_MODE=true`.
- Docs describe both symmetric embedded-worker nodes and optional dedicated workers.
- Added `tests/infra/test_k8s_manifest.py`.

### P1: Local uploads and workspace are not distributed storage

Status: protected by distributed-mode startup validation and Kubernetes defaults.

Evidence:
- Local uploads use `LOCAL_STORAGE_PATH`.
- Kubernetes manifest enables S3 and disables local fallback, which is correct.
- Docker Compose mounts `./uploads` and is documented as single-replica only.
- Kubernetes mounts `/app/workspace` as `emptyDir`.

Impact:
- Local upload mode is not safe for multi-replica deployments.
- Workspace artifacts on `emptyDir` are pod-local and disappear on restart.

Fix:
- Keep S3 mandatory in multi-replica docs and validation.
- Make startup validation warn or fail for multi-replica mode with `S3_ENABLED=false`.
- Document `workspace` as ephemeral unless backed by an external sandbox/storage backend.

Verification:
- Added validation coverage for distributed mode with `S3_ENABLED=false`.
- Kubernetes manifest sets `S3_ENABLED=true` and `ENABLE_LOCAL_FILESYSTEM_FALLBACK=false`.

### P1: MongoDB event flush drops oldest buffered events when MongoDB is slow

Status: improved with explicit diagnostics.

Evidence:
- `src/infra/session/dual_writer.py` drops old buffer entries when `SESSION_EVENT_MONGO_BUFFER_MAX` is exceeded.

Impact:
- Protects memory, but can silently lose durable event history during MongoDB degradation.
- Redis Streams remain temporary and TTL-bound.

Fix:
- Add explicit metrics/logging counters for dropped events.
- Consider failing the affected run or marking trace durability degraded when drops occur.

Verification:
- `DualEventWriter.get_diagnostics()` now exposes `mongo_buffer_dropped_total` and `mongo_buffer_last_drop`.
- Added `tests/infra/test_dual_writer_limits.py::test_mongo_buffer_overflow_updates_diagnostics`.

### P2: WebSocket route discovery scans Redis keys per targeted delivery

Status: fixed in `src/infra/websocket.py`.

Evidence:
- `ConnectionManager.send_to_user_with_broadcast()` scans `ws:route:{user_id}:*`.

Impact:
- Per-user scans are bounded but still add Redis load for high-frequency notifications or users connected through many instances.

Fix:
- Replace scan-per-send with a Redis Set per user (`ws:routes:{user_id}`) plus TTL-refreshing instance keys, or keep scan but expose metrics and tune `WS_ROUTE_SCAN_LIMIT`.

Verification:
- Route registration now maintains `ws:routes:{user_id}` Redis Sets.
- Targeted delivery uses `SMEMBERS` plus route-key health checks instead of SCAN.
- Added/updated WebSocket manager tests for Set fan-out and bounded delivery.

### Already Protected: Scheduled task multi-instance execution

Evidence:
- Scheduler jobs are process-local, but `src/infra/scheduler/runner.py` uses Redis slot locks and task locks before executing.

Impact:
- Multiple API pods can register the same schedule without duplicate execution for the same fire slot.

Action:
- Keep as is, but add operational metrics for lock contention and skipped slots.

## Immediate Repair Plan

1. Fixed queued chat dispatch so arq mode stays on arq after dequeue.
2. Added distributed startup validation for stable secrets and shared upload storage.
3. Updated Kubernetes production guidance and manifest for symmetric nodes with embedded arq workers, with dedicated workers documented as optional.
4. Added targeted regression tests for the hard defects and performance improvements.
5. Run focused backend tests before completion.
