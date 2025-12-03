// =============================================================================
// Key Vault Secrets Module
// =============================================================================
// Stores application secrets in Azure Key Vault
// =============================================================================

@description('The name of the Key Vault')
param keyVaultName string

@description('Database connection string')
@secure()
param databaseUrl string

@description('Storage account key')
@secure()
param storageAccountKey string

@description('Admin password')
@secure()
param adminPassword string

@description('Azure AI API key (optional)')
@secure()
param azureAiApiKey string = ''

// Reference existing Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// Database URL secret
resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'database-url'
  properties: {
    value: databaseUrl
    contentType: 'text/plain'
  }
}

// Storage account key secret
resource storageKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-account-key'
  properties: {
    value: storageAccountKey
    contentType: 'text/plain'
  }
}

// Admin password secret
resource adminPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'admin-password'
  properties: {
    value: adminPassword
    contentType: 'text/plain'
  }
}

// Azure AI API key secret (only if provided)
resource azureAiApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(azureAiApiKey)) {
  parent: keyVault
  name: 'azure-ai-api-key'
  properties: {
    value: azureAiApiKey
    contentType: 'text/plain'
  }
}
