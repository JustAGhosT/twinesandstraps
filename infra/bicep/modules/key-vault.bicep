// =============================================================================
// Key Vault Module
// =============================================================================
// Creates Azure Key Vault for secrets management
// =============================================================================

@description('The name of the Key Vault')
param name string

@description('The Azure region for the resource')
param location string

@description('Tags to apply to the resource')
param tags object = {}

@description('The tenant ID for Azure AD')
param tenantId string = subscription().tenantId

@description('Enable soft delete')
param enableSoftDelete bool = true

@description('Soft delete retention days')
param softDeleteRetentionInDays int = 7

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    enabledForDeployment: true
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enableRbacAuthorization: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

@description('The Key Vault name')
output name string = keyVault.name

@description('The Key Vault URI')
output uri string = keyVault.properties.vaultUri

@description('The Key Vault resource ID')
output id string = keyVault.id
