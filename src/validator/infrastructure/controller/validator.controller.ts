import { Injectable } from '@nestjs/common';
import { ValidateFileUseCase } from '../../application/use-cases/validate-file.usecase';
import { ValidatorInput } from '../../domain/types/validator-input.types';
import { ValidatorOutput } from '../../domain/types/validator-output.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class ValidatorController {
  constructor(private readonly useCase: ValidateFileUseCase) {}

  @HandleExecution('VALIDATOR')
  async handle(event: ValidatorInput): Promise<ValidatorOutput> {
    return this.useCase.execute(event);
  }
}
