import { Injectable, Logger } from '@nestjs/common';
import { ParseFileUseCase } from '../../application/use-cases/parse-file.usecase';
import { ParseInput } from '../../domain/types/parser-input.types';
import { ParseOutput } from '../../domain/types/parser-output.types';

@Injectable()
export class ParserController {
  private readonly logger = new Logger(ParserController.name);

  constructor(private readonly useCase: ParseFileUseCase) {}

  async handle(event: ParseInput): Promise<ParseOutput> {
    try {
      return await this.useCase.execute(event);
    } catch (error) {
      this.logger.error('Error en parser', error);
      throw error;
    }
  }
}
