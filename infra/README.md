# HealthSync AI — Infrastructure (IaC)

This directory contains the **Infrastructure as Code (IaC)** templates for provisioning Azure resources using **Bicep**.

## Structure
- `/modules`: Reusable Bicep modules (networking, AKS, ACR, Key Vault, Azure SQL, Service Bus).
- `/environments`: Environment-specific parameter sheets (`dev.bicepparam`, `prod.bicepparam`).
- `main.bicep`: Main deployment orchestrator composition module.
