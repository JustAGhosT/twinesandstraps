// =============================================================================
// App Service Plan Module
// =============================================================================
// Creates Azure App Service Plan for hosting the web application
// =============================================================================

@description('The name of the App Service Plan')
param name string

@description('The Azure region for the resource')
param location string

@description('Tags to apply to the resource')
param tags object = {}

@description('The SKU name for the App Service Plan')
@allowed(['B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1v2', 'P2v2', 'P3v2', 'P1v3', 'P2v3', 'P3v3'])
param skuName string = 'B1'

@description('The SKU tier for the App Service Plan')
@allowed(['Basic', 'Standard', 'PremiumV2', 'PremiumV3'])
param skuTier string = 'Basic'

@description('The number of instances')
param capacity int = 1

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: name
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: skuName
    tier: skuTier
    capacity: capacity
  }
  properties: {
    reserved: true // Required for Linux
    zoneRedundant: skuTier == 'PremiumV3' ? true : false
  }
}

@description('The App Service Plan name')
output name string = appServicePlan.name

@description('The App Service Plan resource ID')
output id string = appServicePlan.id
