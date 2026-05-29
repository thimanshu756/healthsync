#!/bin/bash
set -e

echo "Getting Subscription and Tenant ID..."
SUB_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo "Creating AAD App 'healthsync-github-actions'..."
# Check if it already exists
APP_ID=$(az ad app list --display-name healthsync-github-actions --query "[0].appId" -o tsv)
if [ -z "$APP_ID" ]; then
  APP_ID=$(az ad app create --display-name healthsync-github-actions --query appId -o tsv)
fi
OBJECT_ID=$(az ad app show --id $APP_ID --query id -o tsv)

echo "Creating Service Principal..."
SP_ID=$(az ad sp show --id $APP_ID --query id -o tsv 2>/dev/null || az ad sp create --id $APP_ID --query id -o tsv)

echo "Waiting for SP propagation..."
sleep 10

echo "Assigning Contributor role to the Subscription..."
az role assignment create --role contributor --subscription $SUB_ID --assignee-object-id $SP_ID --assignee-principal-type ServicePrincipal --scope /subscriptions/$SUB_ID || true

echo "Creating Federated Credentials..."
cat <<EOF > fed-main.json
{
  "name": "healthsync-github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:thimanshu756/healthsync:ref:refs/heads/main",
  "description": "GitHub Actions main branch",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF
az ad app federated-credential create --id $OBJECT_ID --parameters @fed-main.json || true

cat <<EOF > fed-feature.json
{
  "name": "healthsync-github-feature",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:thimanshu756/healthsync:ref:refs/heads/feature/phase1-core-infra",
  "description": "GitHub Actions feature branch",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF
az ad app federated-credential create --id $OBJECT_ID --parameters @fed-feature.json || true

echo "Setting GitHub Secrets..."
gh secret set AZURE_CLIENT_ID -b "$APP_ID"
gh secret set AZURE_TENANT_ID -b "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID -b "$SUB_ID"

echo "OIDC Setup Complete!"
