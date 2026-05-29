# HealthSync AI — Local Tooling Setup & Verification

This guide outlines the local workstation prerequisites and verification commands required to successfully build and deploy the **HealthSync AI** platform.

---

## 1. Required Tooling Checklist

Before starting Phase 1, ensure you have the following installed on your machine:

| Tool | Purpose | Installation (macOS via Homebrew) |
| :--- | :--- | :--- |
| **Azure CLI (`az`)** | Principal command-line tool to manage Azure resources. | `brew install azure-cli` |
| **Bicep CLI** | Language parser to compile and deploy Infrastructure as Code templates. | `az bicep install` or `brew install bicep` |
| **`kubectl`** | The Kubernetes command-line tool to inspect and govern clusters. | `brew install kubernetes-cli` |
| **`helm`** | Package manager for Kubernetes charts. | `brew install helm` |
| **`argocd` CLI** | Client utility for managing GitOps applications inside Kubernetes. | `brew install argocd` |
| **Docker / Colima** | Local container building and runtime engine. | `brew install docker` or install Docker Desktop |
| **`trivy`** | Vulnerability scanner to check container images for CVEs before pushing. | `brew install aquasecurity/trivy/trivy` |
| **`k9s`** *(Optional)*| Terminal dashboard UI for interacting with Kubernetes clusters. | `brew install k9s` |

---

## 2. Workstation Diagnostics & Verification

Run these commands in your terminal to verify that each tool is correctly installed, configured, and logged in.

### 2.1 Azure CLI Verification
Verify your Azure login status and ensure you are targeting the correct subscription:
```bash
az account show --output table
```
*Expected Output: A table displaying your active Azure subscription and user email details.*

### 2.2 Bicep CLI Verification
Verify Bicep is accessible and check its version:
```bash
az bicep version
# OR if installed via homebrew:
bicep --version
```
*Expected Output: `Bicep CLI version 0.x.x`*

### 2.3 Kubernetes (`kubectl`) Verification
Ensure `kubectl` is installed:
```bash
kubectl version --client --output=yaml
```
*Expected Output: Client version details showing GitVersion.*

### 2.4 Helm Verification
Ensure `helm` is installed:
```bash
helm version
```

### 2.5 ArgoCD CLI Verification
Ensure `argocd` is installed:
```bash
argocd version --client
```

### 2.6 Trivy Scanner Verification
Ensure `trivy` is installed and ready:
```bash
trivy --version
```

### 2.7 Docker Runtime Verification
Ensure the container engine is running:
```bash
docker info --format '{{.OSType}}'
```
*Expected Output: `linux` or your system OS name.*
