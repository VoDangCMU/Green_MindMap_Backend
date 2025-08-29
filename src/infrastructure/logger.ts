import * as api from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { config } from '../config/env';

const SCHEMA_NAME = 'https://github.com/grafana/docker-otel-lgtm';

export interface LogFields {
  [key: string]: any;
}

export class LoggerClient {
  private tracer: api.Tracer;
  private meter: api.Meter;
  private loggerProvider?: LoggerProvider;

  constructor() {
    this.initializeOpenTelemetry();
    this.tracer = api.trace.getTracer(SCHEMA_NAME);
    this.meter = api.metrics.getMeter(SCHEMA_NAME);
  }

  private initializeOpenTelemetry(): void {
    try {
      console.log(
        `Initializing OpenTelemetry with service name: ${config.grafana.serviceName}`
      );
      console.log(`OTLP endpoint: ${config.grafana.otlpEndpoint}/v1/logs`);


      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: config.grafana.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'green-mindmap',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.app.env,
      });

      const logExporter = new OTLPLogExporter({
        url: `${config.grafana.otlpEndpoint}/v1/logs`,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.loggerProvider = new LoggerProvider({
        resource: resource,
      });

      const batchProcessor = new BatchLogRecordProcessor(logExporter, {
        scheduledDelayMillis: 500,
        maxExportBatchSize: 1,
        maxQueueSize: 10,
        exportTimeoutMillis: 10000,
      });

      this.loggerProvider.addLogRecordProcessor(batchProcessor);

      console.log('OpenTelemetry logger initialized successfully');
    } catch (err) {
      console.error('Failed to initialize OpenTelemetry logger:', err);
    }
  }

  info(message: string, fields?: LogFields): void {
    this.log('INFO', message, fields);
  }

  error(message: string, error?: Error, fields?: LogFields): void {
    const logFields = { ...fields };
    if (error) {
      logFields.error = error.message;
      logFields.stack = error.stack;
    }
    this.log('ERROR', message, logFields);
  }

  warn(message: string, fields?: LogFields): void {
    this.log('WARN', message, fields);
  }

  debug(message: string, fields?: LogFields): void {
    this.log('DEBUG', message, fields);
  }

  private async sendLogDirect(level: string, message: string, fields?: LogFields): Promise<void> {
    try {
      const logData = {
        resourceLogs: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: config.grafana.serviceName } },
              { key: 'service.version', value: { stringValue: '1.0.0' } },
              { key: 'service.namespace', value: { stringValue: 'green-mindmap' } },
              { key: 'deployment.environment', value: { stringValue: config.app.env } }
            ]
          },
          scopeLogs: [{
            scope: { name: SCHEMA_NAME },
            logRecords: [{
              severityText: level,
              body: { stringValue: message },
              timeUnixNano: String(Date.now() * 1000000),
              attributes: Object.entries({ environment: config.app.env, ...fields }).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) }
              }))
            }]
          }]
        }]
      };

      const response = await fetch(`${config.grafana.otlpEndpoint}/v1/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });
    } catch (err) {
      console.error('[ERROR] Direct log failed:', err);
    }
  }

  private log(level: string, message: string, fields?: LogFields): void {
    try {
      this.sendLogDirect(level, message, fields);
    } catch (err) {
      console.error('[ERROR] Failed to emit log:', err);
    }
  }

  logHTTPRequest(
      method: string,
      path: string,
      userId?: string,
      statusCode?: number,
      duration?: number
  ): void {
    this.info('HTTP Request', {
      method,
      path,
      userId,
      statusCode,
      durationMs: duration,
    });
  }

  logDBOperation(
      operation: string,
      table: string,
      duration?: number,
      error?: Error
  ): void {
    const fields = { operation, table, durationMs: duration };
    if (error) {
      this.error('Database operation failed', error, fields);
    } else {
      this.info('Database operation completed', fields);
    }
  }

  createSpan(
      name: string,
      attributes?: Record<string, string | number | boolean>
  ): api.Span {
    return this.tracer.startSpan(name, { attributes });
  }

  async shutdown(): Promise<void> {
    if (this.loggerProvider) {
      await this.loggerProvider.shutdown();
    }
  }
}

let loggerInstance: LoggerClient | null = null;

export function initLogger(): LoggerClient {
  if (!loggerInstance) {
    loggerInstance = new LoggerClient();
  }
  return loggerInstance;
}

export function getLogger(): LoggerClient {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call initLogger() first.');
  }
  return loggerInstance;
}

export const logger = initLogger();
