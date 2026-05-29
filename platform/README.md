# HealthSync AI — Kubernetes Platform

This directory contains the Kubernetes configuration layer, defining how our microservices are deployed, scaled, networked, and monitored inside AKS.

## Structure
- `/argocd`: GitOps application orchestrators (`app-of-apps.yaml` and child apps).
- `/charts`: Standard Helm charts for application services and background workers.
- `/namespaces`: Kubernetes namespace manifests.
- `/network-policies`: Network isolation and firewall control policies.
- `/resource-quotas`: CPU and Memory hard limits per namespace.
- `/keda`: KEDA Autoscaling definitions (`ScaledObjects` and `TriggerAuthentication`).
