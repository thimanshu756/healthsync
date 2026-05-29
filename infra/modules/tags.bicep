targetScope = 'subscription'

param environment string
param owner string = 'HealthSync-Platform'

output resourceTags object = {
  Environment: environment
  Owner: owner
  ManagedBy: 'Bicep'
  Project: 'HealthSync-AI'
}
