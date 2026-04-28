import { Injectable } from '@nestjs/common';
import { StartExecutionCommand } from '@aws-sdk/client-sfn';
import { sfnClient } from '../config/aws.config';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';
import { AwsErrorCodes } from '../constants/aws-errors.constants';

@Injectable()
export class SfnClient {
  async startExecution(stateMachineArn: string, name: string, input: string): Promise<boolean> {
    return awsError(
      async () => {
        await sfnClient.send(new StartExecutionCommand({ stateMachineArn, name, input }));
        return true;
      },
      ErrorDictionary.SFN_UNAVAILABLE,
      [{ code: AwsErrorCodes.SFN_EXECUTION_ALREADY_EXISTS, result: false }],
    );
  }
}
