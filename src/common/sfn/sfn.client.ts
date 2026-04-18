import { Injectable } from '@nestjs/common';
import { StartExecutionCommand, ExecutionAlreadyExists } from '@aws-sdk/client-sfn';
import { sfnClient } from '../config/aws.config';

@Injectable()
export class SfnClient {
  async startExecution(stateMachineArn: string, name: string, input: string): Promise<boolean> {
    try {
      await sfnClient.send(new StartExecutionCommand({ stateMachineArn, name, input }));
      return true;
    } catch (error) {
      if (error instanceof ExecutionAlreadyExists) return false;
      throw error;
    }
  }
}
