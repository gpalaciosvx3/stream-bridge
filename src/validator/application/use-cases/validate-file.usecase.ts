import { Injectable } from '@nestjs/common';
import { ValidatorService } from '../../domain/service/validator.service';
import { ValidatorInput } from '../../domain/types/validator-input.types';
import { ValidatorOutput } from '../../domain/types/validator-output.types';

@Injectable()
export class ValidateFileUseCase {
  constructor(private readonly validatorService: ValidatorService) {}

  async execute(input: ValidatorInput): Promise<ValidatorOutput> {
    return this.validatorService.validate(input);
  }
}
