param vaultName string
param location string
param tags object
param subnetId string
param dnsZoneId string

// 1. Key Vault with RBAC Authorization enabled
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'standard'
      family: 'A'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true // Enforces unified Azure RBAC policies instead of legacy Access Policies
    publicNetworkAccess: 'Disabled' // Secure by default: blocks public internet inbound
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

// 2. Private Endpoint inside our private-endpoints subnet
resource pe 'Microsoft.Network/privateEndpoints@2023-11-01' = {
  name: 'pe-${vaultName}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'pe-conn-${vaultName}'
        properties: {
          privateLinkServiceId: kv.id
          groupIds: [
            'vault' // Vault resource sub-resource ID
          ]
        }
      }
    ]
  }
}

// 3. DNS Zone Group registering the Private Endpoint in our Private DNS Zone
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

// 4. Placeholder Secret for the SQL connection string
resource dbSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: 'db-connection-string'
  properties: {
    #disable-next-line no-hardcoded-env-urls
    value: 'Server=tcp:sql-healthsync-dev.database.windows.net,1433;Database=healthsync-dev;User ID=dummy;Password=dummy;'
  }
}

output vaultId string = kv.id
output vaultUri string = kv.properties.vaultUri
