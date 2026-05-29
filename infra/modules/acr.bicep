param acrName string
param location string
param tags object
param aksPrincipalId string = ''

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false // Best practice: enforce token or managed identity auth
  }
}

// AcrPull role definition ID
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(aksPrincipalId)) {
  name: guid(acr.id, aksPrincipalId, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: aksPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output acrId string = acr.id
output acrLoginServer string = acr.properties.loginServer
