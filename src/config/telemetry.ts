// This file must be imported FIRST to properly configure OpenTelemetry
import { config } from './env';

// Set OpenTelemetry environment variables before any other modules are loaded
process.env.OTEL_SERVICE_NAME = config.grafana.serviceName;
process.env.OTEL_SERVICE_VERSION = '1.0.0';
process.env.OTEL_SERVICE_NAMESPACE = 'green-mindmap';
process.env.OTEL_RESOURCE_ATTRIBUTES = [
  `service.name=${config.grafana.serviceName}`,
  'service.version=1.0.0',
  'service.namespace=green-mindmap',
  `deployment.environment=${config.app.env}`
].join(',');

console.log(`OpenTelemetry configured with service name: ${config.grafana.serviceName}`);
