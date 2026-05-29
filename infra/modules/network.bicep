param vnetName string
param location string
param tags object

// 1. Network Security Group for System Subnet
resource nsgSystem 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: 'nsg-aks-system-${vnetName}'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'allow-dns-outbound'
        properties: {
          priority: 100
          direction: 'Outbound'
          access: 'Allow'
          protocol: 'Udp'
          sourcePortRange: '*'
          destinationPortRange: '53'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

// 2. Network Security Group for Workload Subnet
resource nsgWorkload 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: 'nsg-aks-workload-${vnetName}'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

// 3. Network Security Group for Private Endpoints
resource nsgPE 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: 'nsg-pe-${vnetName}'
  location: location
  tags: tags
  properties: {
    securityRules: []
  }
}

// 4. Virtual Network with Subnet Configurations
resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'snet-aks-system'
        properties: {
          addressPrefix: '10.0.0.0/22'
          networkSecurityGroup: {
            id: nsgSystem.id
          }
        }
      }
      {
        name: 'snet-aks-workload'
        properties: {
          addressPrefix: '10.0.4.0/22'
          networkSecurityGroup: {
            id: nsgWorkload.id
          }
        }
      }
      {
        name: 'snet-private-endpoints'
        properties: {
          addressPrefix: '10.0.8.0/24'
          networkSecurityGroup: {
            id: nsgPE.id
          }
        }
      }
    ]
  }
}

// 5. Private DNS Zones
resource dnsACR 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.azurecr.io'
  location: 'global'
  tags: tags
}

resource dnsKeyVault 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'
  tags: tags
}

resource dnsSQL 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.${environment().suffixes.sqlServerHostname}'
  location: 'global'
  tags: tags
}

// 6. Virtual Network Links for Private DNS Zones
resource linkACR 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: dnsACR
  name: '${dnsACR.name}-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource linkKeyVault 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: dnsKeyVault
  name: '${dnsKeyVault.name}-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

resource linkSQL 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: dnsSQL
  name: '${dnsSQL.name}-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

// Outputs
output vnetId string = vnet.id
output systemSubnetId string = vnet.properties.subnets[0].id
output workloadSubnetId string = vnet.properties.subnets[1].id
output peSubnetId string = vnet.properties.subnets[2].id

output dnsZoneAcrId string = dnsACR.id
output dnsZoneKeyVaultId string = dnsKeyVault.id
output dnsZoneSqlId string = dnsSQL.id
