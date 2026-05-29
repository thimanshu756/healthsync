#!/bin/bash
set -e

echo "Creating Managed Identity for Billing Service..."
az identity create --name id-billing-service --resource-group rg-healthsync-platform-dev

UAMI_CLIENT_ID=$(az identity show --name id-billing-service --resource-group rg-healthsync-platform-dev --query clientId -o tsv)
UAMI_PRINCIPAL_ID=$(az identity show --name id-billing-service --resource-group rg-healthsync-platform-dev --query principalId -o tsv)

echo "Client ID: $UAMI_CLIENT_ID"
echo "Principal ID: $UAMI_PRINCIPAL_ID"

sleep 10

echo "Assigning Key Vault Secrets User role..."
KV_NAME=$(az keyvault list --resource-group rg-healthsync-platform-dev --query "[0].name" -o tsv)
KV_ID=$(az keyvault show --name $KV_NAME --query id -o tsv)
az role assignment create --role "Key Vault Secrets User" --assignee-object-id $UAMI_PRINCIPAL_ID --assignee-principal-type ServicePrincipal --scope $KV_ID || true

echo "Creating Federated Credential..."
AKS_OIDC_ISSUER=$(az aks show --name aks-healthsync-dev --resource-group rg-healthsync-platform-dev --query "oidcIssuerProfile.issuerUrl" -o tsv)
az identity federated-credential create --name billing-service-fed --identity-name id-billing-service --resource-group rg-healthsync-platform-dev --issuer $AKS_OIDC_ISSUER --subject system:serviceaccount:app-billing-service:billing-service-sa --audiences api://AzureADTokenExchange || true

echo "Workload Identity setup complete! Client ID: $UAMI_CLIENT_ID"
