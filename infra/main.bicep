targetScope = 'subscription'

@allowed([
  'dev'
  'prod'
])
@description('The target environment for deployment.')
param environmentName string = 'dev'

@description('The primary location for all deployed resource groups.')
param location string = 'centralindia'

// 1. Instantiate the standard tagging module
module tags './modules/tags.bicep' = {
  name: 'standard-tags'
  params: {
    environment: environmentName
  }
}

// 2. Deploy the Platform Resource Group
module rgPlatform './modules/resourcegroups.bicep' = {
  name: 'rg-platform-deployment'
  params: {
    rgName: 'rg-healthsync-platform-${environmentName}'
    location: location
  }
}

// 3. Deploy the App Resource Group
module rgApp './modules/resourcegroups.bicep' = {
  name: 'rg-app-deployment'
  params: {
    rgName: 'rg-healthsync-app-${environmentName}'
    location: location
  }
}

// 4. Deploy Networking inside the Platform Resource Group
module network './modules/network.bicep' = {
  name: 'network-deployment'
  scope: resourceGroup('rg-healthsync-platform-${environmentName}')
  dependsOn: [
    rgPlatform
  ]
  params: {
    vnetName: 'vnet-healthsync-${environmentName}'
    location: location
    tags: tags.outputs.resourceTags
  }
}

// 5. Deploy Log Analytics Workspace (LAW) inside the Platform Resource Group
module monitoring './modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  scope: resourceGroup('rg-healthsync-platform-${environmentName}')
  dependsOn: [
    rgPlatform
  ]
  params: {
    workspaceName: 'law-healthsync-${environmentName}'
    location: location
    tags: tags.outputs.resourceTags
  }
}

// 6. Deploy private AKS Cluster inside the Platform Resource Group
module aks './modules/aks.bicep' = {
  name: 'aks-deployment'
  scope: resourceGroup('rg-healthsync-platform-${environmentName}')
  dependsOn: [
    rgPlatform
  ]
  params: {
    clusterName: 'aks-healthsync-${environmentName}'
    location: location
    tags: tags.outputs.resourceTags
    systemSubnetId: network.outputs.systemSubnetId
    workloadSubnetId: network.outputs.workloadSubnetId
    workspaceId: monitoring.outputs.workspaceId
  }
}

// 7. Deploy Azure Container Registry (ACR) inside the Platform Resource Group
module acr './modules/acr.bicep' = {
  name: 'acr-deployment'
  scope: resourceGroup('rg-healthsync-platform-${environmentName}')
  dependsOn: [
    rgPlatform
  ]
  params: {
    acrName: 'acrhealthsync${environmentName}'
    location: location
    tags: tags.outputs.resourceTags
    aksPrincipalId: aks.outputs.kubeletPrincipalId // Wire AKS identity for ACR pull permissions
  }
}

// 8. Deploy Azure Key Vault inside the Platform Resource Group
module keyvault './modules/keyvault.bicep' = {
  name: 'keyvault-deployment'
  scope: resourceGroup('rg-healthsync-platform-${environmentName}')
  dependsOn: [
    rgPlatform
  ]
  params: {
    vaultName: 'kv-healthsync-${environmentName}'
    location: location
    tags: tags.outputs.resourceTags
    subnetId: network.outputs.peSubnetId
    dnsZoneId: network.outputs.dnsZoneKeyVaultId
  }
}

// Subscription-level outputs
output platformResourceGroup string = rgPlatform.outputs.rgName
output appResourceGroup string = rgApp.outputs.rgName
output vnetId string = network.outputs.vnetId
output systemSubnetId string = network.outputs.systemSubnetId
output workloadSubnetId string = network.outputs.workloadSubnetId
output peSubnetId string = network.outputs.peSubnetId

output acrId string = acr.outputs.acrId
output acrLoginServer string = acr.outputs.acrLoginServer

output vaultId string = keyvault.outputs.vaultId
output vaultUri string = keyvault.outputs.vaultUri

output logAnalyticsWorkspaceId string = monitoring.outputs.workspaceId
output logAnalyticsWorkspaceCustomerId string = monitoring.outputs.workspaceCustomerId

output aksClusterId string = aks.outputs.clusterId
output aksClusterName string = aks.outputs.clusterName
output aksOidcIssuerUrl string = aks.outputs.oidcIssuerUrl
