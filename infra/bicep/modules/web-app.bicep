// =============================================================================
// Web App (App Service) Module
// =============================================================================
// Creates Azure App Service for hosting the Next.js application
// =============================================================================

@description('The name of the Web App')
param name string

@description('The Azure region for the resource')
param location string

@description('Tags to apply to the resource')
param tags object = {}

@description('The App Service Plan resource ID')
param appServicePlanId string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string

@description('PostgreSQL database connection string')
@secure()
param databaseUrl string

@description('Azure Storage account name')
param storageAccountName string

@description('Azure Storage account key')
@secure()
param storageAccountKey string

@description('Azure Storage container name')
param storageContainerName string

@description('Admin password for the application')
@secure()
param adminPassword string

@description('WhatsApp number for quotes')
param whatsappNumber string

@description('Azure AI endpoint (optional)')
param azureAiEndpoint string = ''

@description('Azure AI API key (optional)')
@secure()
param azureAiApiKey string = ''

@description('Azure AI deployment name (optional)')
param azureAiDeploymentName string = ''

@description('Environment name')
param environment string

// Web App
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appCommandLine: 'npm run start'
      alwaysOn: environment == 'prod'
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health'
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'ENABLE_ORYX_BUILD'
          value: 'true'
        }
        {
          name: 'DATABASE_URL'
          value: databaseUrl
        }
        {
          name: 'AZURE_STORAGE_ACCOUNT_NAME'
          value: storageAccountName
        }
        {
          name: 'AZURE_STORAGE_ACCOUNT_KEY'
          value: storageAccountKey
        }
        {
          name: 'AZURE_STORAGE_CONTAINER_NAME'
          value: storageContainerName
        }
        {
          name: 'ADMIN_PASSWORD'
          value: adminPassword
        }
        {
          name: 'NEXT_PUBLIC_WHATSAPP_NUMBER'
          value: whatsappNumber
        }
        {
          name: 'NEXT_PUBLIC_SITE_URL'
          value: 'https://${name}.azurewebsites.net'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'AZURE_AI_ENDPOINT'
          value: azureAiEndpoint
        }
        {
          name: 'AZURE_AI_API_KEY'
          value: azureAiApiKey
        }
        {
          name: 'AZURE_AI_DEPLOYMENT_NAME'
          value: azureAiDeploymentName
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
      ]
    }
  }
}

// Staging slot for production environment
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = if (environment == 'prod') {
  parent: webApp
  name: 'staging'
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appCommandLine: 'npm run start'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health'
    }
  }
}

// Auto-scale settings for production
resource autoScale 'Microsoft.Insights/autoscalesettings@2022-10-01' = if (environment == 'prod') {
  name: 'autoscale-${name}'
  location: location
  tags: tags
  properties: {
    enabled: true
    targetResourceUri: appServicePlanId
    profiles: [
      {
        name: 'Auto scale'
        capacity: {
          minimum: '1'
          maximum: '3'
          default: '1'
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlanId
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 70
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlanId
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 30
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
        ]
      }
    ]
  }
}

@description('The Web App URL')
output url string = 'https://${webApp.properties.defaultHostName}'

@description('The Web App name')
output name string = webApp.name

@description('The Web App resource ID')
output id string = webApp.id

@description('The Web App principal ID (managed identity)')
output principalId string = webApp.identity.principalId
