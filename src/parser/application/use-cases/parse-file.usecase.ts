import { Injectable } from '@nestjs/common';
import { ParserService } from '../../domain/service/parser.service';
import { ParseInput } from '../../domain/types/parser-input.types';
import { ParseOutput } from '../../domain/types/parser-output.types';
import { LogExecution } from '../../../common/decorator/log-execution.decorator';

@Injectable()
export class ParseFileUseCase {
  constructor(private readonly parserService: ParserService) {}

  @LogExecution('PARSER')
  async execute(input: ParseInput): Promise<ParseOutput> {
    return this.parserService.parse(input);
  }
}
