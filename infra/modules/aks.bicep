param clusterName string
param location string
param tags object
param systemSubnetId string
param workloadSubnetId string
param workspaceId string

// 1. User-Assigned Managed Identity for AKS Control Plane
resource aksIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${clusterName}'
  location: location
  tags: tags
}

// 2. Private AKS Cluster with Workload Identity and CNI Overlay
resource aks 'Microsoft.ContainerService/managedClusters@2023-11-01' = {
  name: clusterName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${aksIdentity.id}': {}
    }
  }
  properties: {
    dnsPrefix: clusterName
    kubernetesVersion: '1.30.3' // Stable release version
    enableRBAC: true
    
    // Core Private Cluster security: blocks API server access from the public internet
    apiServerAccessProfile: {
      enablePrivateCluster: true
    }
    
    agentPoolProfiles: [
      {
        name: 'systempool'
        count: 1
        vmSize: 'Standard_B2s' // 2 vCPU, 4GB RAM (highly cost-conscious system host)
        osType: 'Linux'
        mode: 'System'
        vnetSubnetID: systemSubnetId
      }
      {
        name: 'apppool'
        count: 2
        vmSize: 'Standard_B2s' // 2 vCPU, 4GB RAM (app host)
        osType: 'Linux'
        mode: 'User'
        vnetSubnetID: workloadSubnetId
      }
    ]
    
    // Modern Network profile: Azure CNI Overlay
    networkProfile: {
      networkPlugin: 'azure'
      networkPluginMode: 'Overlay'
      podCidr: '10.244.0.0/16'
      serviceCidr: '10.0.12.0/22'
      dnsServiceIP: '10.0.12.10'
    }
    
    // Identity Federation: Enables OIDC Token exchange for Workload Identities
    oidcIssuerProfile: {
      enabled: true
    }
    securityProfile: {
      workloadIdentity: {
        enabled: true
      }
    }
    
    // Container Insights Log Analytics Integration
    addonProfiles: {
      omsagent: {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: workspaceId
        }
      }
    }
  }
}

output clusterId string = aks.id
output clusterName string = aks.name
output oidcIssuerUrl string = aks.properties.oidcIssuerProfile.issuerURL
output kubeletPrincipalId string = aks.properties.identityProfile.kubeletidentity.objectId
