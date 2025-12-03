// =============================================================================
// PostgreSQL Flexible Server Module
// =============================================================================
// Creates Azure Database for PostgreSQL Flexible Server
// =============================================================================

@description('The name of the PostgreSQL server')
param name string

@description('The Azure region for the resource')
param location string

@description('Tags to apply to the resource')
param tags object = {}

@description('The administrator login for PostgreSQL')
@secure()
param administratorLogin string

@description('The administrator password for PostgreSQL')
@secure()
param administratorPassword string

@description('The name of the database to create')
param databaseName string = 'twinesandstraps'

@description('The SKU name for the server')
param skuName string = 'Standard_B1ms'

@description('The storage size in GB')
param storageSizeGB int = 32

@description('Enable high availability')
param highAvailability bool = false

@description('The PostgreSQL version')
@allowed(['14', '15', '16'])
param version string = '16'

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: contains(skuName, 'Standard_B') ? 'Burstable' : 'GeneralPurpose'
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: storageSizeGB
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: highAvailability ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: highAvailability ? 'ZoneRedundant' : 'Disabled'
    }
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
  }
}

// Database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Firewall rule to allow Azure services
resource firewallRuleAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// PostgreSQL configuration for optimal Next.js performance
resource maxConnections 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = {
  parent: postgresServer
  name: 'max_connections'
  properties: {
    value: '100'
    source: 'user-override'
  }
}

@description('The PostgreSQL server FQDN')
output serverFqdn string = postgresServer.properties.fullyQualifiedDomainName

@description('The PostgreSQL server name')
output serverName string = postgresServer.name

@description('The database name')
output databaseName string = database.name

@description('The connection string for the database')
output connectionString string = 'postgresql://${administratorLogin}:${administratorPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'

@description('The PostgreSQL server resource ID')
output id string = postgresServer.id
