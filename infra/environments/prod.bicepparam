using '../main.bicep'

param environmentName = 'prod'
param location = 'centralindia'

@secure()
param sqlAdminPassword = 'DummySecurePasswordProd123!'
