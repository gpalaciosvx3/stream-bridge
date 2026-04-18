import { APIGatewayProxyEvent, APIGatewayProxyEventV2, SQSEvent } from 'aws-lambda';
import { LambdaExtracted, StepFnExtracted } from './types/lambda-event.types';

export class LambdaEventMiddleware {
  static extract(event: unknown): LambdaExtracted {
    if (LambdaEventMiddleware.isApiGwV2(event)) {
      const e = event as APIGatewayProxyEventV2;
      return {
        source: 'api-gw',
        body: JSON.parse(e.body ?? '{}'),
        pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
        queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
      };
    }

    if (LambdaEventMiddleware.isApiGwV1(event)) {
      const e = event as APIGatewayProxyEvent;
      return {
        source: 'api-gw',
        body: JSON.parse(e.body ?? '{}'),
        pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
        queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
      };
    }

    if (LambdaEventMiddleware.isSqs(event)) {
      const e = event as SQSEvent;
      return {
        source: 'sqs',
        records: e.Records.map(r => ({
          body: JSON.parse(r.body),
          messageId: r.messageId,
        })),
      };
    }

    if (LambdaEventMiddleware.isStepFn(event)) {
      return { 
        source: 'step-fn',
        input: event 
      };
    }

    throw new Error(`Evento no reconocido`);
  }

  private static isApiGwV2(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      typeof e['requestContext'] === 'object' &&
      e['requestContext'] !== null &&
      'http' in (e['requestContext'] as object)
    );
  }

  private static isApiGwV1(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      typeof e['requestContext'] === 'object' &&
      e['requestContext'] !== null &&
      'httpMethod' in (e['requestContext'] as object)
    );
  }

  private static isSqs(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      Array.isArray(e['Records']) &&
      (e['Records'] as unknown[]).length > 0 &&
      typeof (e['Records'] as Record<string, unknown>[])[0]['eventSource'] === 'string' &&
      (e['Records'] as Record<string, unknown>[])[0]['eventSource'] === 'aws:sqs'
    );
  }

  private static isStepFn(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      !Array.isArray(e) &&
      !('requestContext' in e) &&
      !('Records' in e)
    );
  }
}
