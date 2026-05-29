param workspaceName string
param location string
param tags object

resource law 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018' // standard pay-as-you-go tier
    }
    retentionInDays: 30 // cost-conscious dev retention window (minimum & cheapest)
  }
}

output workspaceId string = law.id
output workspaceCustomerId string = law.properties.customerId
