param sbNamespaceName string
param location string
param tags object

// 1. Service Bus Namespace (Standard required for pub/sub topics)
resource sb 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: sbNamespaceName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

// 2. Point-to-Point Queues
resource emailQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: sb
  name: 'notifications-email'
}

resource smsQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: sb
  name: 'notifications-sms'
}

resource heavyJobsQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: sb
  name: 'heavy-jobs'
}

// 3. Publish-Subscribe Topic
resource domainEventsTopic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: sb
  name: 'domain-events'
}

// 4. Topic Subscriptions for event consumption
resource billingSub 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: domainEventsTopic
  name: 'billing-sub'
}

resource notificationsSub 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: domainEventsTopic
  name: 'notifications-sub'
}

resource analyticsSub 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = {
  parent: domainEventsTopic
  name: 'analytics-sub'
}

output sbNamespaceName string = sb.name

#disable-next-line outputs-should-not-contain-secrets
output sbConnectionString string = listKeys('${sb.id}/AuthorizationRules/RootManageSharedAccessKey', sb.apiVersion).primaryConnectionString
