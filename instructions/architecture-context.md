# HealthSync AI — Azure DevOps Learning Platform (Architecture Context)

This file is the **single source of truth** for the system being built. It describes the client story, the full Azure architecture, every microservice and worker, the queue topology, and the phased implementation plan. The agent must always refer to this file for facts about the system.

***

## 1. Client story and problem

**Client:** HealthSync AI — a fictional, growing healthcare SaaS used by multiple clinics across Europe.

**What the platform does:**
- Manages patient onboarding and records.
- Handles appointment scheduling and reminders.
- Processes payments and generates billing records.
- Sends email and SMS notifications to patients.
- (Target state) Provides AI-assisted triage and analytics for clinic admins.

### Current AWS-era pain points

The client built fast on AWS during their startup phase. The infrastructure is now in a state that cannot support growth:

| Problem | Detail |
|---------|--------|
| Crashes during peak load | Appointment campaigns, reminder batches, and billing jobs all hit simultaneously. The cluster cannot scale fast enough and services fall over. |
| No real autoscaling | Scaling is manual — someone resizes EC2 nodes or restarts pods. There is no queue-based or event-driven scaling. |
| Secret sprawl | Database passwords, API keys, and config values are hardcoded in env files, CI variables, and AWS console configs with no central governance. |
| Weak observability | Logs are scattered, there are no consistent metrics, and debugging production incidents takes hours because there is no tracing. |
| Unpredictable costs | The team cannot attribute cloud spend to specific services or features. Costs spike during incidents with no explanation. |
| Infrastructure drift | No infrastructure as code. Resources were created by clicking in the console. Nobody is sure what exists or why. |

### Migration trigger

The client receives **10,000 USD in Azure credits** and decides this is the right moment to migrate off AWS. Rather than a lift-and-shift, they engage an engineer (the learner) to:

1. Design a modern, scalable platform on Azure.
2. Rebuild the core services with proper DevOps from the ground up.
3. Introduce observability, security, cost controls, and automation.
4. Provide ongoing platform management once migration is complete.

> This project is a **learning-focused re-implementation** of that engagement. The emphasis is on DevOps and platform engineering. Application code is intentionally minimal.

***

## 2. Repository structure

The project uses three repositories (or three top-level directories in a monorepo):

```
healthsync-ai/
├── infra/                  ← Bicep templates and modules (infrastructure as code)
│   ├── modules/
│   │   ├── network.bicep
│   │   ├── aks.bicep
│   │   ├── acr.bicep
│   │   ├── keyvault.bicep
│   │   ├── sql.bicep
│   │   ├── servicebus.bicep
│   │   └── monitoring.bicep
│   ├── environments/
│   │   ├── dev.bicepparam
│   │   └── prod.bicepparam
│   └── main.bicep
│
├── platform/               ← Kubernetes platform config (ArgoCD, Helm charts, cluster config)
│   ├── argocd/
│   │   ├── app-of-apps.yaml
│   │   └── apps/
│   ├── charts/
│   │   ├── patient-service/
│   │   ├── appointment-service/
│   │   ├── billing-service/
│   │   ├── notification-worker/
│   │   └── frontend/
│   ├── namespaces/
│   ├── network-policies/
│   ├── resource-quotas/
│   └── keda/
│
└── services/               ← Application source code
    ├── patient-service/
    ├── appointment-service/
    ├── billing-service/
    ├── notification-worker/
    ├── frontend/
    └── shared/             ← Shared utilities (logging config, base Dockerfile, etc.)
```

***

## 3. Environment and naming conventions

### Environments

| Name | Purpose | Status |
|------|---------|--------|
| `dev` | Active development and learning environment | Deployed |
| `staging` | Pre-production validation | Conceptual (documented, not deployed) |
| `prod` | Production simulation | Conceptual (documented, not deployed) |

For this learning project, only `dev` is actually deployed. `staging` and `prod` are designed and documented to demonstrate the promotion workflow.

### Resource naming pattern

```
<resource-type>-healthsync-<env>

Examples:
  rg-healthsync-platform-dev
  rg-healthsync-app-dev
  aks-healthsync-dev
  acr-healthsync-dev
  kv-healthsync-dev
  sql-healthsync-dev
  sb-healthsync-dev
  law-healthsync-dev        (Log Analytics Workspace)
```

***

## 4. Azure resource map

### 4.1 Resource groups

| Resource Group | Contains |
|----------------|----------|
| `rg-healthsync-platform-dev` | VNet, AKS, ACR, Key Vault, Log Analytics |
| `rg-healthsync-app-dev` | Azure SQL, Service Bus, Storage Account |

### 4.2 Networking

| Resource | Configuration | Notes |
|----------|--------------|-------|
| VNet | `10.0.0.0/16` | One per environment |
| `snet-aks-system` | `10.0.0.0/22` | System node pool |
| `snet-aks-workload` | `10.0.4.0/22` | App node pool |
| `snet-private-endpoints` | `10.0.8.0/24` | Private endpoints for SQL, Key Vault, ACR |
| NSG — system subnet | Restrict inbound | No public inbound, allow AKS control plane |
| NSG — workload subnet | Restrict inbound | Allow only from gateway and system subnet |
| Private DNS zones | Per service | Auto-registered by private endpoints |

### 4.3 AKS cluster

| Setting | Value | Reason |
|---------|-------|--------|
| Cluster type | Private | API server not exposed to internet |
| Node pool — system | 1 × `Standard_B2s` | Hosts system workloads (controllers, ArgoCD, observability agents) |
| Node pool — app | 2 × `Standard_B2s` | Hosts business services and workers |
| Identity | User-assigned managed identity | Used for ACR pull, Key Vault access, etc. |
| Workload identity | Enabled | Allows pods to authenticate to Azure without storing credentials |
| OIDC issuer | Enabled | Required for workload identity |
| Network plugin | Azure CNI Overlay | Best for private clusters at this scale |
| ACR integration | Enabled | AKS identity gets `AcrPull` role on ACR automatically |
| Kubernetes version | Latest stable | Always use stable channel |

### 4.4 Container registry (ACR)

| Setting | Value |
|---------|-------|
| Tier | Basic |
| Admin user | Disabled (use managed identity) |
| Geo-replication | Not used (cost saving) |
| Image scanning | Microsoft Defender integration (basic) |

### 4.5 Key Vault

| Setting | Value |
|---------|-------|
| Tier | Standard |
| Access model | RBAC (not vault access policies) |
| Network access | Private endpoint in `snet-private-endpoints` |
| Secrets stored | DB connection strings, Service Bus connection strings, app config values |
| Pod access method | Workload Identity + CSI Secrets Store Driver |

### 4.6 Azure SQL Database

| Setting | Value | Reason |
|---------|-------|--------|
| Tier | Basic (5 DTU) | Cheapest tier; sufficient for minimal CRUD learning |
| Server | One logical server: `sql-healthsync-dev` | Shared server, separate databases or schemas |
| Database strategy | **One database, separate schemas per service** | Cheapest; demonstrates logical isolation without extra cost |
| Schemas | `patients`, `appointments`, `billing` | Each service owns exactly one schema |
| Connectivity | Private endpoint only | No public internet access |
| Backup redundancy | Locally redundant (LRS) | Cheapest option |
| Auto-pause | Enabled if using serverless tier | Saves cost when idle |

> Schema isolation is the default. If separate databases are ever needed for a specific learning goal, it must be justified and cost-confirmed first.

### 4.7 Azure Service Bus

| Setting | Value | Reason |
|---------|-------|--------|
| Tier | Standard | Basic tier does not support topics; Standard is needed for pub/sub |
| Namespace | `sb-healthsync-dev` | One namespace per environment |
| Topics | `domain-events` | Used for async events between services |
| Topic subscriptions | `billing-sub`, `analytics-sub` | Each subscriber gets its own filtered subscription |
| Queues | `notifications-email`, `notifications-sms`, `heavy-jobs` | Direct queues for worker consumption |
| Authentication | Managed Identity (no connection strings in code) | Connection string stored in Key Vault only for fallback |

### 4.8 Log Analytics workspace

| Setting | Value |
|---------|-------|
| Name | `law-healthsync-dev` |
| Retention | 30 days (minimum, cheapest) |
| Connected to | AKS (Container Insights), Azure Monitor, Defender |

### 4.9 Observability stack (inside AKS)

Self-hosted inside AKS to minimise Azure cost (uses existing node capacity):

| Component | Tool | Namespace |
|-----------|------|-----------|
| Metrics collection | Prometheus (via kube-prometheus-stack) | `observability` |
| Metrics visualisation | Grafana | `observability` |
| Log aggregation | Loki | `observability` |
| Log shipping agent | Promtail or Grafana Alloy | `observability` |
| Distributed tracing | Tempo | `observability` |
| Instrumentation | OpenTelemetry SDK in each service | Per service |

Azure Monitor and Container Insights are used in addition (free tier coverage) for node-level and AKS control-plane telemetry.

### 4.10 Edge and ingress

| Component | Tool | Notes |
|-----------|------|-------|
| Public entry point | Azure Front Door + WAF | Provides DDoS protection, WAF rules, global routing |
| In-cluster routing | Kubernetes Gateway API | Replaces legacy Ingress; one external LoadBalancer only |
| Gateway implementation | Kong Gateway (or Envoy Gateway) | Deployed in `api-gateway` namespace |

### 4.11 Security and governance

| Component | Tool | Purpose |
|-----------|------|---------|
| Admission control | Kyverno | Enforce no-root containers, required labels, etc. |
| Network isolation | Kubernetes NetworkPolicies | Default-deny + explicit allow per namespace |
| Service mesh | Linkerd | mTLS between app services, identity-based access |
| Azure governance | Azure Policy | Enforce private AKS, HTTPS only, allowed SKUs |
| Container posture | Defender for Containers | Vulnerability scanning and runtime protection |

***

## 5. Microservices and workers

Every service is **intentionally minimal** — just enough to build and push a container, deploy into AKS, connect to data or queues, and emit logs/metrics/traces.

### 5.1 Patient Service

- **Type:** HTTP API
- **Language:** Python (Flask) or Node.js (Express) — learner's choice
- **Namespace:** `backend-patient`
- **Endpoints:**
  - `GET /patients` — list all patients
  - `POST /patients` — create a patient
  - `GET /patients/{id}` — get one patient
  - `DELETE /patients/{id}` — delete a patient
- **Data model:**
  - `id` (UUID)
  - `name`
  - `date_of_birth`
  - `contact_email`
- **Database:** Azure SQL, schema `patients`
- **Events published:** `PatientRegistered` → Service Bus topic `domain-events`
- **Secrets used:** DB connection string from Key Vault via CSI driver

### 5.2 Appointment Service

- **Type:** HTTP API
- **Namespace:** `backend-appointment`
- **Endpoints:**
  - `GET /appointments`
  - `POST /appointments`
  - `GET /appointments/{id}`
  - `PATCH /appointments/{id}/status`
- **Data model:**
  - `id` (UUID)
  - `patient_id`
  - `clinic_id`
  - `datetime`
  - `status` (scheduled / cancelled / completed)
- **Database:** Azure SQL, schema `appointments`
- **Events published:** `AppointmentScheduled`, `AppointmentCancelled`, `AppointmentCompleted` → `domain-events`
- **Events consumed:** optionally `PatientRegistered` (for basic validation)

### 5.3 Billing Service

- **Type:** HTTP API
- **Namespace:** `backend-billing`
- **Endpoints:**
  - `GET /invoices`
  - `GET /invoices/{id}`
  - `PATCH /invoices/{id}/status`
- **Data model:**
  - `id` (UUID)
  - `patient_id`
  - `amount`
  - `status` (draft / issued / paid)
- **Database:** Azure SQL, schema `billing`
- **Events consumed:** `AppointmentCompleted` → creates a draft invoice automatically
- **Subscription:** `billing-sub` on `domain-events` topic

### 5.4 Notification Worker

- **Type:** Background worker (no HTTP API)
- **Namespace:** `workers`
- **Consumes from:**
  - Queue: `notifications-email`
  - Queue: `notifications-sms`
- **Behaviour:**
  - Receives message payload (recipient, type, body).
  - Logs a structured "sent notification" event (mock — no real provider).
- **Scaled by:** KEDA, trigger = queue length on `notifications-email` and `notifications-sms`
- **KEDA config:**
  - `minReplicaCount: 0` (scales to zero when queues are empty)
  - `maxReplicaCount: 4`
  - Trigger: Azure Service Bus queue message count

### 5.5 Frontend (minimal)

- **Type:** Web UI
- **Namespace:** `frontend`
- **Tech:** Simple static HTML + JS (or minimal React)
- **Capabilities:**
  - Create a patient (calls `/api/patients` via gateway)
  - Book an appointment (calls `/api/appointments` via gateway)
  - Trigger a test notification (enqueues a message to `notifications-email`)
- **Purpose:** Enables end-to-end platform testing and observability demo flows

### 5.6 AI Assistant Service (Phase 5 — optional)

- **Type:** HTTP API
- **Namespace:** `backend-ai`
- **Endpoint:** `POST /assistant/query`
- **Input:** natural language question about a patient or appointment
- **Output:** AI-generated response (via Azure OpenAI) or a stub response
- **Key learning goal:** Demonstrates secure outbound access using Managed Identity + Key Vault

### 5.7 Analytics Service (Phase 5 — optional)

- **Type:** Background worker
- **Namespace:** `workers`
- **Consumes:** All events from `domain-events` via `analytics-sub`
- **Behaviour:** Aggregates per-clinic appointment and billing counts into a summary table
- **Database:** Azure SQL schema `analytics` or Cosmos DB (serverless) if budget allows

***

## 6. Queue and worker topology

```
┌─────────────────────────────────────────────────────────────┐
│                   Azure Service Bus                          │
│                                                             │
│  Topic: domain-events                                        │
│  ├── Subscription: billing-sub    → Billing Service         │
│  └── Subscription: analytics-sub → Analytics Worker (P5)    │
│                                                             │
│  Queue: notifications-email  → Notification Worker (KEDA)   │
│  Queue: notifications-sms    → Notification Worker (KEDA)   │
│  Queue: heavy-jobs           → (reserved for future use)    │
└─────────────────────────────────────────────────────────────┘
```

**Event flow example — Appointment booked:**

```
Client → Frontend → Gateway → Appointment Service
  → publishes AppointmentScheduled to domain-events
    → Billing Service receives via billing-sub (no action yet)
  → enqueues message to notifications-email
    → Notification Worker scales up (KEDA) → logs "reminder sent"
```

***

## 7. Kubernetes namespace layout

| Namespace | Contents | Network policy |
|-----------|----------|----------------|
| `frontend` | Frontend web app | Allow inbound from gateway only |
| `backend-patient` | Patient service | Allow inbound from gateway only; outbound to SQL, Service Bus |
| `backend-appointment` | Appointment service | Allow inbound from gateway only; outbound to SQL, Service Bus |
| `backend-billing` | Billing service | Allow inbound from gateway + Service Bus consumer; outbound to SQL |
| `workers` | Notification worker, analytics worker | No inbound HTTP; outbound to Service Bus |
| `api-gateway` | Kong / Envoy Gateway, GatewayClass, Gateway, HTTPRoute | Allow inbound from internet (via Front Door); outbound to backends |
| `observability` | Prometheus, Grafana, Loki, Tempo, Promtail | Allow inbound from all (scraping); no sensitive outbound |
| `argocd` | ArgoCD server, repo server, application controller | Allow outbound to GitHub and AKS API |
| `security` | Kyverno, admission webhook | Allow inbound from AKS API server |
| `tools` | Miscellaneous debug tools | Restricted; not in mesh |

**Linkerd mesh scope:**

- Meshed: `frontend`, `backend-patient`, `backend-appointment`, `backend-billing`, `workers`
- Not meshed: `observability`, `argocd`, `security`, `api-gateway`, `tools`

***

## 8. CI/CD and GitOps flow

```
Developer pushes to services/ repo
        │
        ▼
GitHub Actions — CI pipeline
  1. Build Docker image
  2. Run unit tests (minimal)
  3. Scan image with Trivy
  4. Push image to ACR (tag = git SHA)
  5. Update image tag in platform/ repo (via PR or direct commit to env branch)
        │
        ▼
ArgoCD detects change in platform/ repo
  → Syncs Helm chart to AKS namespace
  → Deployment rolls out new pods
  → Health check confirms rollout success
        │
        ▼
Developer pushes to infra/ repo
        │
        ▼
GitHub Actions — Infra pipeline
  1. Bicep lint and validate
  2. What-if diff (shows changes without applying)
  3. Manual approval gate (for prod-like environments)
  4. Bicep deploy via OIDC (no stored service principal secrets)
```

***

## 9. Security model

### Secret management

- All secrets live in **Azure Key Vault**.
- Pods access secrets using **Workload Identity** (OIDC federation) and the **CSI Secrets Store Driver**.
- No Kubernetes `Secret` objects containing real values (only CSI-mounted secrets).
- No secrets in GitHub Actions variables except the OIDC credentials for Azure login.

### Network security layers

| Layer | Tool | What it enforces |
|-------|------|-----------------|
| VNet level | NSGs | Block public inbound to node subnets |
| Kubernetes level | NetworkPolicies | Default deny all; explicit allow per service pair |
| Service level | Linkerd mTLS | Encrypted and identity-verified service-to-service traffic |
| Azure resource level | Private endpoints | SQL, Key Vault, ACR not reachable from internet |
| Edge level | Front Door WAF | Block common attack patterns before reaching AKS |

### Admission control (Kyverno policies)

- Reject pods running as root.
- Require `resources.requests` and `resources.limits` on all containers.
- Require standard labels (`app`, `version`, `component`).
- Disallow `latest` image tags in production.

***

## 10. Resource quotas (reference values for dev environment)

These are starting values sized for 2 × `Standard_B2s` app nodes. Adjust as services are added.

| Namespace | CPU request limit | Memory request limit | Max pods |
|-----------|------------------|---------------------|----------|
| `frontend` | 200m | 256Mi | 4 |
| `backend-patient` | 300m | 384Mi | 4 |
| `backend-appointment` | 300m | 384Mi | 4 |
| `backend-billing` | 300m | 384Mi | 4 |
| `workers` | 500m | 512Mi | 8 |
| `api-gateway` | 400m | 512Mi | 4 |
| `observability` | 1000m | 1.5Gi | 12 |
| `argocd` | 500m | 768Mi | 8 |
| `security` | 200m | 256Mi | 4 |

***

## 11. Phase implementation plan

| Phase | Goal | Key deliverables |
|-------|------|-----------------|
| **Phase 0** | Skeleton and structure | Repo layout, naming conventions, environment strategy |
| **Phase 1** | Core infra + first service | Bicep modules for network/AKS/ACR/KV/SQL/SB, Patient service end-to-end (Docker → ACR → Helm → ArgoCD → AKS) |
| **Phase 2** | More services + gateway | Appointment service, Billing service, Gateway API routing, Frontend |
| **Phase 3** | Queues + workers + KEDA | Service Bus queues/topics, Notification worker, KEDA ScaledObject, load demo |
| **Phase 4** | Observability + security | Prometheus/Grafana/Loki/Tempo, NetworkPolicies, ResourceQuota, Linkerd, Azure Policy |
| **Phase 5** | Optional advanced features | AI assistant, Analytics service, cost dashboards, resilience tests |

***

## 12. Cost reference (dev environment estimates)

All values are rough monthly estimates for the `dev` environment running 24/7. Actual costs may vary.

| Resource | SKU / tier | Est. monthly cost (USD) |
|----------|-----------|------------------------|
| AKS node pool (3 × B2s) | Standard_B2s | ~$45–55 |
| Azure SQL Database | Basic 5 DTU | ~$5 |
| Service Bus | Standard namespace | ~$10 |
| ACR | Basic | ~$5 |
| Key Vault | Standard | ~$1–2 |
| Log Analytics | Pay-as-you-go | ~$5–10 |
| Azure Front Door | Standard | ~$35 (optional; can skip in dev) |
| Storage Account | Standard LRS | ~$1–2 |
| **Total (without Front Door)** | | **~$72–89 / month** |
| **Total (with Front Door)** | | **~$107–124 / month** |

> With 200 USD total credit and ~$72–89/month burn rate, the dev environment can run for approximately **2–2.5 months**. Front Door can be skipped in dev and replaced with a basic LoadBalancer to extend the credit window.