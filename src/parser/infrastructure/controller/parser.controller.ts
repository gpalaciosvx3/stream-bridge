import { Injectable } from '@nestjs/common';
import { ParseFileUseCase } from '../../application/use-cases/parse-file.usecase';
import { ParseInput } from '../../domain/types/parser-input.types';
import { ParseOutput } from '../../domain/types/parser-output.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class ParserController {
  constructor(private readonly useCase: ParseFileUseCase) {}

  @HandleExecution('PARSER')
  async handle(event: ParseInput): Promise<ParseOutput> {
    return this.useCase.execute(event);
  }
}
