// =============================================================================
// Storage Account Module
// =============================================================================
// Creates Azure Storage Account for blob storage (product images, logos)
// =============================================================================

@description('The name of the Storage Account (must be globally unique, lowercase, no hyphens)')
@minLength(3)
@maxLength(24)
param name string

@description('The Azure region for the resource')
param location string

@description('Tags to apply to the resource')
param tags object = {}

@description('The name of the blob container to create')
param containerName string = 'images'

@description('The storage account SKU')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Standard_ZRS'])
param skuName string = 'Standard_LRS'

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Blob Service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    cors: {
      corsRules: [
        {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

// Container for images
resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'Blob'
  }
}

@description('The storage account name')
output name string = storageAccount.name

@description('The storage account primary access key')
output primaryKey string = storageAccount.listKeys().keys[0].value

@description('The storage account primary blob endpoint')
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob

@description('The storage account resource ID')
output id string = storageAccount.id
