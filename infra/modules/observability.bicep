param location string = resourceGroup().location
param grafanaName string = 'grafana-${uniqueString(resourceGroup().id)}'
param monitorWorkspaceName string = 'monitor-${uniqueString(resourceGroup().id)}'
param adminObjectId string

resource monitorWorkspace 'Microsoft.Monitor/accounts@2023-04-03' = {
  name: monitorWorkspaceName
  location: location
}

resource grafana 'Microsoft.Dashboard/grafana@2023-09-01' = {
  name: grafanaName
  location: location
  sku: {
    name: 'Standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    grafanaIntegrations: {
      azureMonitorWorkspaceIntegrations: [
        {
          azureMonitorWorkspaceResourceId: monitorWorkspace.id
        }
      ]
    }
  }
}

// Grant Grafana Identity the Monitoring Reader and Monitoring Data Reader roles on the Monitor Workspace
resource monitoringReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(grafana.id, monitorWorkspace.id, 'MonitoringReader')
  scope: monitorWorkspace
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '43d0d8ad-25c7-4714-9337-8ba259a9fe05')
    principalId: grafana.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource monitoringDataReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(grafana.id, monitorWorkspace.id, 'MonitoringDataReader')
  scope: monitorWorkspace
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b0d8363b-8ddd-447d-831f-62ca05bff136')
    principalId: grafana.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant User the Grafana Admin role
resource grafanaAdminRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(grafana.id, adminObjectId, 'GrafanaAdmin')
  scope: grafana
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '22926164-76b3-42b3-bc55-97df8dab3e41')
    principalId: adminObjectId
    principalType: 'User'
  }
}

output grafanaId string = grafana.id
output monitorWorkspaceId string = monitorWorkspace.id
output grafanaUrl string = grafana.properties.endpoint
