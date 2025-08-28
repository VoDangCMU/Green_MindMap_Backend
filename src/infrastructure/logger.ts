import * as api from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
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
    console.log(
        `Initializing OpenTelemetry with service name: ${config.grafana.serviceName}`
    );

    const logExporter = new OTLPLogExporter({
      url: `${config.grafana.otlpEndpoint}/v1/logs`,
      headers: {
        'Content-Type': 'application/x-protobuf',
      },
    });

    this.loggerProvider = new LoggerProvider({
      processors: [new BatchLogRecordProcessor(logExporter)],
    });
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

  private log(level: string, message: string, fields?: LogFields): void {
    const span = api.trace.getActiveSpan();
    const logFields: LogFields = {
      service_name: config.grafana.serviceName, // Explicitly set service_name
      service: config.grafana.serviceName,
      environment: config.app.env,
      ...fields,
    };

    if (span) {
      const spanContext = span.spanContext();
      logFields.traceId = spanContext.traceId;
      logFields.spanId = spanContext.spanId;
    }

    if (this.loggerProvider) {
      const logger = this.loggerProvider.getLogger(SCHEMA_NAME);
      logger.emit({
        severityText: level,
        body: message,
        attributes: {
          'service.name': config.grafana.serviceName, // OpenTelemetry standard attribute
          'service.version': '1.0.0',
          'service.namespace': 'green-mindmap',
          'deployment.environment': config.app.env,
          ...logFields,
        },
        timestamp: Date.now(),
      });
    }

    if (config.app.env === 'development') {
      const timestamp = new Date().toISOString();
      const fieldsStr = fields ? ` ${JSON.stringify(fields)}` : '';
      console.log(`[${timestamp}] ${level}: ${message}${fieldsStr}`);
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
