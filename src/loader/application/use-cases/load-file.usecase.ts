import { Injectable } from '@nestjs/common';
import { LoaderService } from '../../domain/service/loader.service';
import { LoaderInput } from '../../domain/types/loader-input.types';
import { LoaderOutput } from '../../domain/types/loader-output.types';

@Injectable()
export class LoadFileUseCase {
  constructor(private readonly loaderService: LoaderService) {}

  async execute(input: LoaderInput): Promise<LoaderOutput> {
    return this.loaderService.load(input);
  }
}
