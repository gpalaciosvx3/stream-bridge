import { Injectable } from '@nestjs/common';
import { LoadFileUseCase } from '../../application/use-cases/load-file.usecase';
import { LoaderInput } from '../../domain/types/loader-input.types';
import { LoaderOutput } from '../../domain/types/loader-output.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class LoaderController {
  constructor(private readonly useCase: LoadFileUseCase) {}

  @HandleExecution('LOADER')
  async handle(event: LoaderInput): Promise<LoaderOutput> {
    return this.useCase.execute(event);
  }
}
