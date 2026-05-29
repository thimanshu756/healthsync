# HealthSync AI — Resource Naming Conventions

This document defines the naming conventions and strict Azure constraints for all resources provisioned in the **HealthSync AI** platform.

## General Pattern

Our standard naming template is:
```text
<resource-type>-healthsync-<env>
```

Where `<env>` is either `dev` or `prod` (conceptual).

---

## Azure Resource Constraints & Standards

| Resource Type | Service / Prefix | Target Dev Name | Key Azure Constraints |
| :--- | :--- | :--- | :--- |
| **Resource Group (Platform)** | `rg` | `rg-healthsync-platform-dev` | 1–90 chars, alphanumeric, underscores, hyphens, periods. |
| **Resource Group (App)** | `rg` | `rg-healthsync-app-dev` | 1–90 chars, alphanumeric, underscores, hyphens, periods. |
| **Virtual Network (VNet)** | `vnet` | `vnet-healthsync-dev` | 1–64 chars, alphanumeric, underscores, hyphens, periods. |
| **Subnet** | `snet` | `snet-aks-system` / `snet-aks-workload` | 1–80 chars, alphanumeric, underscores, hyphens, periods. |
| **AKS Cluster** | `aks` | `aks-healthsync-dev` | 1–63 chars, alphanumeric, underscores, hyphens. |
| **Container Registry (ACR)** | `acr` | `acrhealthsyncdev` | **5–50 chars, alphanumeric ONLY. No hyphens or underscores.** Must be globally unique. |
| **Key Vault** | `kv` | `kv-healthsync-dev` | **3–24 chars, alphanumeric and hyphens ONLY.** Must be globally unique. |
| **Azure SQL Server** | `sql` | `sql-healthsync-dev` | 1–63 chars, lowercase letters, numbers, and hyphens. Must be globally unique. |
| **Service Bus Namespace** | `sb` | `sb-healthsync-dev` | 6–50 chars, alphanumeric and hyphens. Must be globally unique. |
| **Log Analytics Workspace**| `law` | `law-healthsync-dev` | 4–63 chars, alphanumeric and hyphens. |
| **Storage Account** | `st` | `sthealthsyncdev` | **3–24 chars, lowercase alphanumeric ONLY. No hyphens.** Must be globally unique. |

---

## Important Exceptions to the Hyphenated Standard

1. **Azure Container Registry (ACR)**: Hyphens are **not** permitted. We drop hyphens and use `acrhealthsyncdev`.
2. **Storage Account (`st`)**: Hyphens are **not** permitted, and names must be entirely lowercase. We drop hyphens and use `sthealthsyncdev`.
3. **Key Vault (`kv`)**: Length is strictly limited to **24 characters**. Using `kv-healthsync-dev` is exactly 17 characters, which safely fits within this constraint.
