// =============================================================================
// Twines and Straps SA - Azure Infrastructure
// =============================================================================
// Main Bicep template for deploying the complete Azure infrastructure
// This orchestrates all modules to create a production-ready environment
// =============================================================================

@description('The environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('The Azure region for all resources')
param location string = resourceGroup().location

@description('The PostgreSQL administrator login')
@secure()
param postgresAdminLogin string

@description('The PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('The admin password for the application')
@secure()
param adminPassword string

@description('WhatsApp Business number for quote requests')
param whatsappNumber string = '27639690773'

@description('Azure AI endpoint (optional, for AI features)')
param azureAiEndpoint string = ''

@description('Azure AI API key (optional, for AI features)')
@secure()
param azureAiApiKey string = ''

@description('Azure AI deployment name (optional)')
param azureAiDeploymentName string = 'gpt-4o'

// =============================================================================
// Variables
// =============================================================================

// Region abbreviation: san = South Africa North
var regionAbbr = 'san'
var tags = {
  Environment: environment
  Application: 'TwinesAndStraps'
  ManagedBy: 'Bicep'
}

// =============================================================================
// Modules
// =============================================================================

// Application Insights for monitoring
module appInsights 'modules/app-insights.bicep' = {
  name: 'appInsights-${environment}'
  params: {
    name: '${environment}-ai-${regionAbbr}-tassa'
    location: location
    tags: tags
  }
}

// Storage Account for blob storage (images)
// Storage accounts: lowercase, no hyphens, max 24 chars
module storage 'modules/storage.bicep' = {
  name: 'storage-${environment}'
  params: {
    name: replace('${environment}st${regionAbbr}tassa', '-', '')
    location: location
    tags: tags
    containerName: 'images'
  }
}

// PostgreSQL Flexible Server
module postgres 'modules/postgres.bicep' = {
  name: 'postgres-${environment}'
  params: {
    name: '${environment}-psql-${regionAbbr}-tassa'
    location: location
    tags: tags
    administratorLogin: postgresAdminLogin
    administratorPassword: postgresAdminPassword
    databaseName: 'twinesandstraps'
    skuName: environment == 'prod' ? 'Standard_B2s' : 'Standard_B1ms'
    storageSizeGB: environment == 'prod' ? 64 : 32
    highAvailability: environment == 'prod'
  }
}

// Key Vault for secrets management
module keyVault 'modules/key-vault.bicep' = {
  name: 'keyVault-${environment}'
  params: {
    name: '${environment}-kv-${regionAbbr}-tassa'
    location: location
    tags: tags
  }
}

// App Service Plan
module appServicePlan 'modules/app-service-plan.bicep' = {
  name: 'appServicePlan-${environment}'
  params: {
    name: '${environment}-asp-${regionAbbr}-tassa'
    location: location
    tags: tags
    skuName: environment == 'prod' ? 'P1v3' : 'B1'
    skuTier: environment == 'prod' ? 'PremiumV3' : 'Basic'
  }
}

// Web App (App Service)
module webApp 'modules/web-app.bicep' = {
  name: 'webApp-${environment}'
  params: {
    name: '${environment}-app-${regionAbbr}-tassa'
    location: location
    tags: tags
    appServicePlanId: appServicePlan.outputs.id
    appInsightsConnectionString: appInsights.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    databaseUrl: postgres.outputs.connectionString
    storageAccountName: storage.outputs.name
    storageAccountKey: storage.outputs.primaryKey
    storageContainerName: 'images'
    adminPassword: adminPassword
    whatsappNumber: whatsappNumber
    azureAiEndpoint: azureAiEndpoint
    azureAiApiKey: azureAiApiKey
    azureAiDeploymentName: azureAiDeploymentName
    environment: environment
  }
}

// Store secrets in Key Vault
module secrets 'modules/secrets.bicep' = {
  name: 'secrets-${environment}'
  params: {
    keyVaultName: keyVault.outputs.name
    databaseUrl: postgres.outputs.connectionString
    storageAccountKey: storage.outputs.primaryKey
    adminPassword: adminPassword
    azureAiApiKey: azureAiApiKey
  }
}

// =============================================================================
// Outputs
// =============================================================================

@description('The URL of the deployed web application')
output webAppUrl string = webApp.outputs.url

@description('The name of the web application')
output webAppName string = webApp.outputs.name

@description('The name of the storage account')
output storageAccountName string = storage.outputs.name

@description('The PostgreSQL server FQDN')
output postgresServerFqdn string = postgres.outputs.serverFqdn

@description('The Key Vault name')
output keyVaultName string = keyVault.outputs.name

@description('The Application Insights name')
output appInsightsName string = appInsights.outputs.name

@description('The resource group name')
output resourceGroupName string = resourceGroup().name
