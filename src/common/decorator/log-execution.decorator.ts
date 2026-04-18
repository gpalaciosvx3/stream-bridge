import { Logger } from '@nestjs/common';

export function LogExecution(featureName: string): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const logger = new Logger(featureName);
      logger.log(`---------- INICIO: ${featureName} ----------`);
      const result = await original.apply(this, args);
      logger.log(`---------- FIN: ${featureName} ----------`);
      return result;
    };

    return descriptor;
  };
}
