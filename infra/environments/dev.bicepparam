using '../main.bicep'

param environmentName = 'dev'
param location = 'centralindia'

@secure()
param sqlAdminPassword = 'DummySecurePassword123!'
