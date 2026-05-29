param sqlServerName string
param location string
param tags object
param subnetId string
param dnsZoneId string

param administratorLogin string = 'sqladmin'
@secure()
param administratorLoginPassword string

// 1. Logical SQL Server
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    publicNetworkAccess: 'Disabled' // Strict Security: blocks public SQL port access from the internet
  }
}

// 2. Cost-Conscious SQL Database (Basic 5 DTU)
resource sqlDb 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: 'healthsync-dev'
  location: location
  tags: tags
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5 // 5 DTUs (cheapest available: ~$5/month)
  }
  properties: {
    requestedBackupStorageRedundancy: 'Local' // Cheapest backup tier (LRS)
  }
}

// 3. Private Endpoint for Azure SQL Server
resource pe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-${sqlServerName}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'pe-conn-${sqlServerName}'
        properties: {
          privateLinkServiceId: sqlServer.id
          groupIds: [
            'sqlServer'
          ]
        }
      }
    ]
  }
}

// 4. DNS Zone Group mapping the Private Endpoint to the SQL DNS Zone
resource dnsGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-11-01' = {
  parent: pe
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: {
          privateDnsZoneId: dnsZoneId
        }
      }
    ]
  }
}

output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDbName string = sqlDb.name
