import { CustomException } from './custom.exception';
import { InputError } from './error.dictionary';

type awsErrorReturn<T> = { code: string; result: T };
type awsErrorThrow = { code: string; error: InputError; context?: string };
type awsErrorHandler<T> = awsErrorReturn<T> | awsErrorThrow;

export async function awsError<T>(
  fn: () => Promise<T>,
  fallback: InputError,
  handlers: awsErrorHandler<T>[] = [],
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (error instanceof CustomException) throw error;
    const handler = handlers.find(h => isAwsError(error, h.code));
    if (!handler) throw new CustomException(fallback);
    if ('error' in handler) throw new CustomException(handler.error, handler.context);
    return handler.result;
  }
}

export function isAwsError(error: unknown, code: string): boolean {
  return error instanceof Error && error.name === code;
}
