# HealthSync AI — Implementation Plan

This file is the **master implementation plan** for the agent. It maps every phase into numbered episodes. Each episode is one focused session. The agent works through exactly one episode per session, teaches the concept, builds the piece, and stops. This keeps sessions short, tokens low, and learning retention high.

***

## How to use this file

- The agent reads the **current episode** at the start of each session.
- The agent works **only on that episode** — nothing more.
- At the end of the episode the agent marks it done and states the next one.
- The learner can ask to revisit any episode at any time.

**Token discipline rules for the agent:**
- Never explain more than one concept at a time.
- Never paste a full file unless explicitly asked — show only the relevant snippet.
- Always wait for the learner to attempt something before showing the answer.
- Keep explanations under 10 sentences per concept.

***

## Phase 0 — Project Skeleton

**Goal:** Set up the repo structure, folder layout, naming conventions, and tooling before writing any infrastructure or application code. This phase has no Azure cost.

***

### Episode 0.1 — Repo structure and folder layout

**What the learner will understand after this:**
- Why a monorepo with three top-level directories (`infra`, `platform`, `services`) maps to three concerns: cloud resources, Kubernetes config, and app code.
- Why separating these three areas matters in a real team (different reviewers, different pipelines, different change frequency).

**What gets built:**
- Folder tree created locally.
- Placeholder `README.md` in each directory explaining its purpose.
- `.gitignore` for common files (Bicep state, node_modules, Python venv, etc.).

**Agent teaching flow:**
1. Explain the three-repo pattern used in real platform teams.
2. Show the folder tree (from architecture context).
3. Ask learner to create the folders and placeholder READMEs.
4. Review and explain what each folder will eventually contain.

***

### Episode 0.2 — Naming conventions and environment strategy

**What the learner will understand after this:**
- Why consistent naming matters in Azure (resource limits, billing attribution, policy targeting).
- What "environment strategy" means and why `dev` is the only deployed env while `staging` and `prod` are documented.

**What gets built:**
- `infra/environments/dev.bicepparam` skeleton (empty params, just the file).
- `infra/environments/prod.bicepparam` skeleton.
- A `CONVENTIONS.md` doc listing naming rules for all resource types.

**Agent teaching flow:**
1. Show the naming pattern: `<type>-healthsync-<env>`.
2. Explain why Azure has naming length limits and why short prefixes matter.
3. Ask learner to write the `CONVENTIONS.md` file themselves.
4. Review and add anything missing.

***

### Episode 0.3 — Tooling setup and local prerequisites

**What the learner will understand after this:**
- What tools are needed locally and why each one exists.
- How Azure CLI, Bicep CLI, kubectl, Helm, and ArgoCD CLI relate to each other.

**What gets built:**
- `docs/local-setup.md` — step-by-step local tooling guide.
- Verification commands confirmed working on the learner's machine.

**Checklist of tools:**
- Azure CLI (`az`) — interact with Azure.
- Bicep CLI — compile and deploy Bicep templates.
- `kubectl` — interact with AKS.
- `helm` — manage Helm charts.
- `argocd` CLI — interact with ArgoCD.
- Docker Desktop or Docker CLI — build images locally.
- `trivy` — scan images locally before CI does it.
- `k9s` (optional but recommended) — terminal UI for Kubernetes.

***

## Phase 1 — Core Infrastructure and First Microservice

**Goal:** Provision the minimum viable Azure platform with Bicep and deploy one working service end-to-end through the full DevOps pipeline. By the end of this phase, a real container is running in AKS, deployed automatically by ArgoCD, with its image built and pushed by GitHub Actions.

***

### Episode 1.1 — Bicep fundamentals and module structure

**What the learner will understand after this:**
- What Bicep is and why it replaces ARM JSON templates.
- What a Bicep module is and why modular structure matters (reuse, readability, DRY).
- How `main.bicep` composes smaller modules.

**What gets built:**
- `infra/main.bicep` — top-level file that calls modules.
- `infra/modules/` directory structure created.
- One tiny example module (`infra/modules/tags.bicep`) that outputs standard tags — simple enough to explain the concept without complexity.

**Agent teaching flow:**
1. Show a 10-line Bicep module example and explain params, resources, and outputs.
2. Explain how `main.bicep` calls a module with `module` keyword.
3. Ask learner to write the `tags.bicep` module themselves.
4. Introduce the concept of `.bicepparam` files for environment values.

***

### Episode 1.2 — Resource groups and network module

**What the learner will understand after this:**
- Why Azure uses resource groups to organise and govern resources.
- What a VNet is and why subnets, NSGs, and private endpoint subnets exist.
- What "private endpoint subnet" means — why it is separate from workload subnets.

**What gets built:**
- `infra/modules/resourcegroups.bicep`
- `infra/modules/network.bicep` — VNet, 3 subnets, 2 NSGs.

**Key concepts to teach:**
- VNet address space (`10.0.0.0/16`) and subnet CIDRs.
- NSG rules: default deny + explicit allows for AKS control plane.
- Why private endpoints need their own subnet.

***

### Episode 1.3 — ACR module

**What the learner will understand after this:**
- What ACR is and why it replaces public registries like Docker Hub.
- Why Basic tier is sufficient here.
- How AKS will pull images from ACR without a password (managed identity).

**What gets built:**
- `infra/modules/acr.bicep` — ACR with Basic SKU.
- RBAC assignment: AKS identity gets `AcrPull` role on ACR.

**Key concepts to teach:**
- What RBAC role assignments look like in Bicep.
- Why `AcrPull` is least-privilege (pull only, no push).

***

### Episode 1.4 — Key Vault module

**What the learner will understand after this:**
- Why Key Vault is better than storing secrets in Kubernetes Secrets or environment variables.
- What "RBAC access model" means vs the older "access policy" model.
- What a private endpoint is and why it stops Key Vault from being reached over the internet.

**What gets built:**
- `infra/modules/keyvault.bicep` — Key Vault, Standard tier, private endpoint, RBAC enabled.
- One placeholder secret added: `db-connection-string` with a dummy value.

***

### Episode 1.5 — Log Analytics workspace module

**What the learner will understand after this:**
- What Log Analytics is and why it is the backbone of Azure observability.
- Why AKS, Defender, and Azure Monitor all send data here.
- What 30-day retention means in cost terms.

**What gets built:**
- `infra/modules/monitoring.bicep` — Log Analytics workspace, 30-day retention.

***

### Episode 1.6 — AKS module (private cluster)

**What the learner will understand after this:**
- What a private AKS cluster is and why the API server is not public.
- What system and workload node pools are and why they are separated.
- What Workload Identity is and why it replaces service principal secrets.
- What OIDC issuer is and how it enables Workload Identity.

**What gets built:**
- `infra/modules/aks.bicep` — private cluster, 2 node pools (`Standard_B2s`), managed identity, OIDC issuer, Workload Identity enabled, Log Analytics integration.

**Key concepts to teach:**
- Why `Standard_B2s` is used (cost, not performance).
- What `systemMode` vs `User` node pool means.
- The difference between managed identity (for the cluster) and workload identity (for pods).

***

### Episode 1.7 — Azure SQL module

**What the learner will understand after this:**
- What a logical SQL server is vs a database.
- Why one database with separate schemas is cheaper and sufficient for learning.
- What private endpoint for SQL means.

**What gets built:**
- `infra/modules/sql.bicep` — SQL logical server, one database (`healthsync-dev`), Basic 5 DTU, private endpoint.
- Connection string added to Key Vault as a secret.

***

### Episode 1.8 — Service Bus module (minimal)

**What the learner will understand after this:**
- What Service Bus is and the difference between queues and topics.
- Why Standard tier is needed (topics require it).
- Why even minimal provisioning now avoids blocking Phase 3.

**What gets built:**
- `infra/modules/servicebus.bicep` — Standard namespace, three queues (`notifications-email`, `notifications-sms`, `heavy-jobs`), one topic (`domain-events`) with two subscriptions (`billing-sub`, `analytics-sub`).

***

### Episode 1.9 — GitHub Actions: Bicep deployment pipeline

**What the learner will understand after this:**
- How GitHub Actions uses OIDC to authenticate to Azure without storing a service principal secret.
- What a Bicep `what-if` step does and why it is important before applying changes.
- How pipeline-driven infra deployments work in a real team.

**What gets built:**
- `.github/workflows/infra-deploy.yml` — trigger on push to `infra/`, steps: login via OIDC → bicep lint → what-if → deploy.
- Azure federated credential configured for the GitHub repo.

**Key concepts to teach:**
- What OIDC federation is (no passwords stored, token exchanged at runtime).
- Why `what-if` is the Bicep equivalent of `terraform plan`.

***

### Episode 1.10 — Connect to AKS and explore the cluster

**What the learner will understand after this:**
- How to get credentials for a private AKS cluster.
- What namespaces look like on a fresh cluster.
- Why the learner should never touch the `kube-system` namespace directly.

**What gets built:**
- `az aks get-credentials` command run locally.
- Learner explores the cluster with `kubectl get nodes`, `kubectl get ns`, `kubectl get pods -A`.

***

### Episode 1.11 — ArgoCD installation and first look

**What the learner will understand after this:**
- What ArgoCD is and why GitOps means "the Git repo is the source of truth, not kubectl commands."
- How ArgoCD continuously reconciles cluster state against the Git repo.
- What an ArgoCD Application resource is.

**What gets built:**
- ArgoCD installed into AKS using Helm: `kubectl create namespace argocd` + `helm install argocd`.
- ArgoCD UI accessed via port-forward.
- Learner logs in and sees the empty dashboard.

***

### Episode 1.12 — Patient service: application code (minimal)

**What the learner will understand after this:**
- What "bare minimum" really means for a learning microservice.
- What structured logging is and why it matters for observability.
- What a health check endpoint is and why Kubernetes requires it.

**What gets built:**
- `services/patient-service/app.py` (Flask) or `app.js` (Express) — 4 endpoints, structured JSON logging, `/health` endpoint.
- `services/patient-service/requirements.txt` or `package.json`.
- Database connection using environment variable (value injected from Key Vault later).

***

### Episode 1.13 — Patient service: Dockerfile

**What the learner will understand after this:**
- Why containers exist and what a Dockerfile does step by step.
- What a non-root user is and why it is a security requirement.
- What a multi-stage build is and why it reduces image size.

**What gets built:**
- `services/patient-service/Dockerfile` — multi-stage, non-root user, HEALTHCHECK instruction.

**Agent teaching flow:**
1. Walk through each Dockerfile instruction (FROM, WORKDIR, COPY, RUN, USER, CMD).
2. Ask learner to write the Dockerfile before showing it.
3. Learner builds and runs the image locally.
4. Review and explain any issues.

***

### Episode 1.14 — Patient service: Helm chart

**What the learner will understand after this:**
- What a Helm chart is and what each file in `templates/` does.
- Why resource limits are mandatory (not optional) in production.
- What liveness and readiness probes do and why they are different.

**What gets built:**
- `platform/charts/patient-service/` — `Chart.yaml`, `values.yaml`, `templates/deployment.yaml`, `templates/service.yaml`, `templates/configmap.yaml`.
- `values.yaml` includes: image repo/tag, resource requests/limits, probe paths, replica count.

**Key template concepts to teach:**
- `deployment.yaml` — what each field means (replicas, selector, containers, probes, resources).
- `service.yaml` — ClusterIP service; why not LoadBalancer.
- `configmap.yaml` — non-sensitive config injected as env vars.

***

### Episode 1.15 — GitHub Actions: CI pipeline for Patient service

**What the learner will understand after this:**
- What a CI pipeline does and in what order (build → test → scan → push).
- What Trivy is and what it scans for (OS packages, language dependencies, known CVEs).
- How ACR image tags work (git SHA as tag = immutable, traceable deployments).

**What gets built:**
- `.github/workflows/patient-service-ci.yml` — trigger on push to `services/patient-service/`, steps: checkout → Docker build → Trivy scan → ACR login via OIDC → Docker push with SHA tag → update image tag in `platform/` repo.

***

### Episode 1.16 — ArgoCD Application for Patient service (GitOps)

**What the learner will understand after this:**
- What an ArgoCD `Application` manifest is.
- How ArgoCD knows which Helm chart to sync and into which namespace.
- What "auto-sync" means and when to use it vs manual sync.

**What gets built:**
- `platform/argocd/apps/patient-service.yaml` — ArgoCD Application pointing at `platform/charts/patient-service/`, target namespace `backend-patient`.
- Learner pushes the manifest and watches ArgoCD sync in the UI.

***

### Episode 1.17 — End-to-end smoke test for Phase 1

**What the learner will understand after this:**
- How to verify the full pipeline works from code push to live pod.
- How to use `kubectl port-forward` to test a service before a gateway exists.
- What to check in ArgoCD to confirm a healthy sync.

**What gets built:**
- A simple test script or `curl` commands to hit the patient service endpoints.
- Learner can `POST /patients` and `GET /patients` successfully.
- Phase 1 confirmed complete.

***

## Phase 2 — Additional Services and API Gateway

**Goal:** Add two more services (Appointment, Billing) and introduce a single controlled API entry point using Kubernetes Gateway API.

***

### Episode 2.1 — Appointment service (code + Docker + Helm)

**What the learner will understand after this:**
- How to apply the same pattern from Phase 1 to a new service faster.
- What service-to-service calls look like inside a cluster (DNS-based: `http://patient-service.backend-patient.svc.cluster.local`).

**What gets built:**
- `services/appointment-service/` — same minimal pattern as Patient service.
- Helm chart under `platform/charts/appointment-service/`.
- CI pipeline (reuse the patient pipeline as a template).

***

### Episode 2.2 — Billing service (code + Docker + Helm)

**What the learner will understand after this:**
- How event-driven design works at a basic level: Billing reacts to `AppointmentCompleted` rather than being called directly.

**What gets built:**
- `services/billing-service/` — minimal Flask/Express app with Service Bus consumer for `billing-sub`.
- Helm chart under `platform/charts/billing-service/`.
- CI pipeline.

***

### Episode 2.3 — Kubernetes namespaces and NetworkPolicies (default deny)

**What the learner will understand after this:**
- Why services must not run in the `default` namespace.
- What a default-deny NetworkPolicy is and why it is applied first.
- How explicit allow rules are added on top.

**What gets built:**
- `platform/namespaces/` — one YAML per namespace (`backend-patient`, `backend-appointment`, `backend-billing`, `workers`, `api-gateway`, `observability`, `argocd`, `security`).
- `platform/network-policies/default-deny.yaml` — applied to every app namespace.
- Explicit allow: `backend-appointment` → `backend-patient` (for patient lookup).

***

### Episode 2.4 — Gateway API: concepts and installation

**What the learner will understand after this:**
- Why Gateway API replaces legacy Ingress (more expressive, better role separation).
- What `GatewayClass`, `Gateway`, `HTTPRoute`, and `ReferenceGrant` are.
- Why there is only one external LoadBalancer.

**What gets built:**
- Gateway API CRDs installed into AKS.
- Kong Gateway (or Envoy Gateway) deployed via Helm into `api-gateway` namespace.

***

### Episode 2.5 — Gateway API: routing rules

**What the learner will understand after this:**
- How path-based routing maps `/api/patients` to the Patient service namespace.
- Why `ReferenceGrant` is needed for cross-namespace backend references.

**What gets built:**
- `platform/gateway/gatewayclass.yaml`
- `platform/gateway/gateway.yaml` — single LoadBalancer in `api-gateway`.
- `platform/gateway/httproutes.yaml` — routes for `/api/patients`, `/api/appointments`, `/api/billing`.
- `platform/gateway/referencegrants.yaml` — one per backend namespace.

***

### Episode 2.6 — Frontend (minimal) + ArgoCD for all services

**What the learner will understand after this:**
- How a minimal frontend calls services through the gateway (not directly).
- What the ArgoCD "app-of-apps" pattern is and why it simplifies managing many apps.

**What gets built:**
- `services/frontend/` — minimal HTML+JS page or tiny React app.
- `platform/argocd/app-of-apps.yaml` — parent Application that manages all child Applications.
- All services deployed and visible in ArgoCD UI.

***

## Phase 3 — Queue, Worker, and Autoscaling Architecture

**Goal:** Introduce async communication through Service Bus and demonstrate KEDA scaling a worker deployment based on queue depth.

***

### Episode 3.1 — Service Bus concepts: queues vs topics

**What the learner will understand after this:**
- The difference between a queue (point-to-point) and a topic (publish-subscribe).
- When to use each one.
- What dead-letter queues are and why they matter.

**What gets built:**
- No code yet — this is a pure teaching episode.
- Learner draws a simple diagram of the queue/topic topology from the architecture context.
- Agent reviews and corrects it.

***

### Episode 3.2 — Notification worker: application code

**What the learner will understand after this:**
- What a worker process looks like vs an HTTP API (no web server, just a loop consuming messages).
- How to consume from Azure Service Bus in code using the SDK.
- Why workers log "mock sent" instead of calling real providers.

**What gets built:**
- `services/notification-worker/worker.py` (or `.js`) — connects to Service Bus, consumes from `notifications-email` and `notifications-sms`, logs structured output.
- Dockerfile (same non-root pattern).

***

### Episode 3.3 — Notification worker: Helm chart

**What the learner will understand after this:**
- What is different about a worker Helm chart vs an API chart (no Service, no Ingress/HTTPRoute, no readiness probe on HTTP port).
- What `minReadySeconds` and `terminationGracePeriodSeconds` mean for a worker.

**What gets built:**
- `platform/charts/notification-worker/` — Deployment only (no Service), with graceful shutdown config.

***

### Episode 3.4 — KEDA installation and concepts

**What the learner will understand after this:**
- What KEDA is and how it extends Kubernetes HPA.
- What a `ScaledObject` is.
- What "scale to zero" means and why it saves cost.
- What the Azure Service Bus scaler trigger looks like.

**What gets built:**
- KEDA installed via Helm into AKS.
- Teaching episode: agent explains `ScaledObject` fields before asking learner to write one.

***

### Episode 3.5 — KEDA ScaledObject for Notification worker

**What the learner will understand after this:**
- How to wire a `ScaledObject` to an Azure Service Bus queue.
- What `minReplicaCount: 0` and `maxReplicaCount: 4` mean in practice.
- How KEDA authenticates to Service Bus using Workload Identity (no connection strings in YAML).

**What gets built:**
- `platform/keda/notification-worker-scaledobject.yaml` — ScaledObject with Service Bus trigger, Workload Identity auth.
- `TriggerAuthentication` resource pointing at the managed identity.

***

### Episode 3.6 — Load demo: trigger autoscaling live

**What the learner will understand after this:**
- How to generate messages into Service Bus manually or via a script.
- How to watch KEDA react and scale the worker up and back down.
- How to read KEDA status with `kubectl describe scaledobject`.

**What gets built:**
- `scripts/load-servicebus.py` (or `.sh`) — sends N messages to `notifications-email` queue.
- Learner runs the script, watches replicas go from 0 → N → 0.
- Learner captures `kubectl get pods -n workers -w` output as demo evidence.

***

## Phase 4 — Observability and Security Hardening

**Goal:** Make the platform fully visible (logs, metrics, traces) and properly secured (NetworkPolicies, ResourceQuota, Linkerd, Azure Policy).

***

### Episode 4.1 — Structured logging in all services

**What the learner will understand after this:**
- What structured logging (JSON) is and why it is better than plain text logs.
- What fields every log line should have (timestamp, level, service, trace_id, message).
- How Loki uses these fields for filtering.

**What gets built:**
- Logging library/config added to all services (if not already done).
- Every log line emits JSON with at minimum: `timestamp`, `level`, `service`, `trace_id`, `message`.

***

### Episode 4.2 — Prometheus metrics in all services

**What the learner will understand after this:**
- What a Prometheus metric is (counter, gauge, histogram).
- Why `http_request_duration_seconds` histogram matters most for API services.
- What a `/metrics` endpoint looks like.

**What gets built:**
- `prometheus_client` (Python) or `prom-client` (Node) added to all services.
- Metrics exposed on `/metrics`: request count, latency histogram, error counter.

***

### Episode 4.3 — Prometheus + Grafana installation

**What the learner will understand after this:**
- What `kube-prometheus-stack` Helm chart includes (Prometheus, Grafana, Alertmanager, node-exporter, kube-state-metrics).
- Why it is installed into its own namespace.
- How Prometheus discovers pods to scrape (ServiceMonitor CRDs).

**What gets built:**
- `kube-prometheus-stack` installed via Helm into `observability` namespace.
- Grafana accessible via port-forward.
- Learner confirms node metrics and pod metrics are visible.

***

### Episode 4.4 — ServiceMonitors for application services

**What the learner will understand after this:**
- What a `ServiceMonitor` CRD is and how Prometheus uses it to discover targets.
- Why each service needs its own `ServiceMonitor`.

**What gets built:**
- `ServiceMonitor` resources added to each Helm chart.
- Learner confirms each service appears as a Prometheus target.

***

### Episode 4.5 — Grafana dashboards

**What the learner will understand after this:**
- How to build a Grafana dashboard from PromQL queries.
- What P50/P95/P99 latency means and why P99 matters more for user experience than average.
- What a useful dashboard looks like for an on-call engineer.

**What gets built:**
- Dashboard 1: API health — request rate, error rate, latency (P50/P95/P99) per service.
- Dashboard 2: Queue and workers — Service Bus queue depth, worker replica count.
- Dashboard 3: Cluster resources — CPU/memory per namespace, pod restart counts.
- Dashboards saved as JSON and committed to `platform/grafana/dashboards/`.

***

### Episode 4.6 — Loki and Promtail for log aggregation

**What the learner will understand after this:**
- What Loki is and why it is "Prometheus for logs" (index labels, not full text).
- How Promtail ships pod logs to Loki automatically.
- How to run a LogQL query in Grafana.

**What gets built:**
- Loki + Promtail (or Grafana Alloy) installed via Helm into `observability`.
- Grafana connected to Loki as a data source.
- Learner queries logs by namespace, service name, and log level.

***

### Episode 4.7 — Distributed tracing with Tempo

**What the learner will understand after this:**
- What distributed tracing is and why a single trace ID connects logs across multiple services.
- What OpenTelemetry is (vendor-neutral instrumentation standard).
- How to read a Jaeger/Grafana trace waterfall.

**What gets built:**
- Tempo installed via Helm into `observability`.
- OpenTelemetry SDK added to Patient and Appointment services (minimal — just trace context propagation).
- OTEL Collector deployed as a DaemonSet or Deployment to receive spans and forward to Tempo.
- Grafana Tempo data source configured.
- Learner traces one request from gateway → patient-service → SQL.

***

### Episode 4.8 — ResourceQuota and LimitRange per namespace

**What the learner will understand after this:**
- What ResourceQuota does (namespace-level hard limits on total CPU/memory/pods).
- What LimitRange does (per-container default requests/limits if chart does not set them).
- Why they prevent one noisy namespace from starving the rest of the cluster.

**What gets built:**
- `platform/resource-quotas/` — one `ResourceQuota` + `LimitRange` YAML per namespace.
- Values taken directly from the quota table in `architecture-context.md`.
- Learner intentionally deploys something that exceeds quota and observes the `Forbidden` error.

***

### Episode 4.9 — Linkerd service mesh

**What the learner will understand after this:**
- What a service mesh is and what problem it solves (mTLS, observability, traffic control — without code changes).
- What mTLS means and why it is better than trusting the network.
- Why Linkerd is lightweight compared to Istio (relevant for small nodes).

**What gets built:**
- Linkerd CLI installed locally.
- Linkerd control plane installed into AKS.
- App namespaces annotated for sidecar injection.
- Learner verifies mTLS using `linkerd viz tap`.
- Learner demonstrates: non-meshed pod → meshed service = rejected.

***

### Episode 4.10 — Azure Policy for governance

**What the learner will understand after this:**
- What Azure Policy is and how it differs from Kubernetes admission control.
- What a policy assignment looks like in Bicep.
- Which built-in policies are most useful for AKS environments.

**What gets built:**
- `infra/modules/policy.bicep` — assigns 2–3 built-in policies:
  - AKS clusters should be private.
  - Container images should come from allowed registries only (ACR).
  - Kubernetes containers should not run as root.
- Learner checks Policy compliance view in Azure Portal.

***

### Episode 4.11 — Defender for Containers (posture check)

**What the learner will understand after this:**
- What Defender for Containers does (image scanning, runtime anomaly detection, posture recommendations).
- Why it requires no code changes (agent-based, managed by Azure).

**What gets built:**
- Defender for Containers enabled on the AKS cluster (free basic scanning tier).
- Learner reviews the security recommendations in Azure Portal.

***

### Episode 4.12 — Branch protection and final pipeline hygiene

**What the learner will understand after this:**
- Why `main` branch protection matters in a team environment.
- What a complete, clean CI pipeline looks like (build → test → scan → push → notify ArgoCD).

**What gets built:**
- Branch protection rules enabled on all three repos (require PR, require review, require status checks).
- All CI pipelines reviewed and cleaned up.
- Any missing steps (e.g. missing Trivy scan on some services) filled in.

***

## Phase 5 — Optional Advanced Features

**Goal:** Extend the platform once the core is solid. Only attempt if Azure credits allow and Phase 4 is complete.

***

### Episode 5.1 — AI Assistant service

**Prerequisite:** Azure OpenAI resource available, or willing to mock responses.

**What gets built:**
- `services/ai-service/` — REST endpoint that calls Azure OpenAI (or returns a mock).
- Demonstrates: Key Vault → Workload Identity → Azure OpenAI API call.
- Helm chart + CI pipeline + ArgoCD application.

***

### Episode 5.2 — Analytics service

**What gets built:**
- `services/analytics-service/` — consumes all events from `domain-events` via `analytics-sub`.
- Writes per-clinic appointment counts to Azure SQL `analytics` schema.
- Grafana panel showing aggregated clinic data.

***

### Episode 5.3 — Resilience exercises

**What gets built:**
- Node drain test: `kubectl drain <node>` → watch pod rescheduling → observe in Grafana.
- PodDisruptionBudgets added to all services.
- Anti-affinity rules added to ensure pods spread across nodes.
- Learner documents observations.

***

### Episode 5.4 — Cost optimisation review

**What gets built:**
- Azure Cost Management dashboard reviewed.
- Tags verified on all resources (service, environment, owner).
- Unused or oversized resources identified and right-sized.
- AKS node pool auto-scaler reviewed.
- Learner writes a short cost optimisation report.

***

## Episode completion tracker

Use this table to track progress. Mark each episode done after the session.

| Episode | Title | Status |
|---------|-------|--------|
| 0.1 | Repo structure and folder layout | ⬜ |
| 0.2 | Naming conventions and environment strategy | ⬜ |
| 0.3 | Tooling setup and local prerequisites | ⬜ |
| 1.1 | Bicep fundamentals and module structure | ⬜ |
| 1.2 | Resource groups and network module | ⬜ |
| 1.3 | ACR module | ⬜ |
| 1.4 | Key Vault module | ⬜ |
| 1.5 | Log Analytics workspace module | ⬜ |
| 1.6 | AKS module (private cluster) | ⬜ |
| 1.7 | Azure SQL module | ⬜ |
| 1.8 | Service Bus module | ⬜ |
| 1.9 | GitHub Actions: Bicep deployment pipeline | ⬜ |
| 1.10 | Connect to AKS and explore the cluster | ⬜ |
| 1.11 | ArgoCD installation and first look | ⬜ |
| 1.12 | Patient service: application code | ⬜ |
| 1.13 | Patient service: Dockerfile | ⬜ |
| 1.14 | Patient service: Helm chart | ⬜ |
| 1.15 | GitHub Actions: CI pipeline for Patient service | ⬜ |
| 1.16 | ArgoCD Application for Patient service | ⬜ |
| 1.17 | End-to-end smoke test for Phase 1 | ⬜ |
| 2.1 | Appointment service | ⬜ |
| 2.2 | Billing service | ⬜ |
| 2.3 | Namespaces and NetworkPolicies | ⬜ |
| 2.4 | Gateway API: concepts and installation | ⬜ |
| 2.5 | Gateway API: routing rules | ⬜ |
| 2.6 | Frontend and ArgoCD app-of-apps | ⬜ |
| 3.1 | Service Bus concepts: queues vs topics | ⬜ |
| 3.2 | Notification worker: application code | ⬜ |
| 3.3 | Notification worker: Helm chart | ⬜ |
| 3.4 | KEDA installation and concepts | ⬜ |
| 3.5 | KEDA ScaledObject for Notification worker | ⬜ |
| 3.6 | Load demo: trigger autoscaling live | ⬜ |
| 4.1 | Structured logging in all services | ⬜ |
| 4.2 | Prometheus metrics in all services | ⬜ |
| 4.3 | Prometheus + Grafana installation | ⬜ |
| 4.4 | ServiceMonitors for application services | ⬜ |
| 4.5 | Grafana dashboards | ⬜ |
| 4.6 | Loki and Promtail for log aggregation | ⬜ |
| 4.7 | Distributed tracing with Tempo | ⬜ |
| 4.8 | ResourceQuota and LimitRange | ⬜ |
| 4.9 | Linkerd service mesh | ⬜ |
| 4.10 | Azure Policy for governance | ⬜ |
| 4.11 | Defender for Containers | ⬜ |
| 4.12 | Branch protection and pipeline hygiene | ⬜ |
| 5.1 | AI Assistant service | ⬜ Optional |
| 5.2 | Analytics service | ⬜ Optional |
| 5.3 | Resilience exercises | ⬜ Optional |
| 5.4 | Cost optimisation review | ⬜ Optional |