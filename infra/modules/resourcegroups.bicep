targetScope = 'subscription'

param rgName string
param location string

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: rgName
  location: location
}

output rgName string = rg.name
