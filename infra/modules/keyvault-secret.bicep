param vaultName string
param secretName string
@secure()
param secretValue string

// Reference the existing Key Vault dynamically by name
resource kv 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: vaultName
}

// Deploy the secret as a child of the referenced Key Vault
resource secret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kv
  name: secretName
  properties: {
    value: secretValue
  }
}
