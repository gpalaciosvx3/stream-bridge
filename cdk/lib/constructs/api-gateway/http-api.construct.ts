import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface HttpApiProps {
  uploadRequestFn: lambda.IFunction;
}

export class HttpApiConstruct extends Construct {
  readonly url: string;

  constructor(scope: Construct, id: string, props: HttpApiProps) {
    super(scope, id);

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: ResourceConstants.API_INGESTION,
      description: 'API de ingesta de archivos StreamBridge',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      },
    });

    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${ResourceConstants.API_INGESTION}-KEY`,
      description: 'API Key para acceso al API de ingesta StreamBridge',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${ResourceConstants.API_INGESTION}-PLAN`,
      apiStages: [{ api, stage: api.deploymentStage }],
      throttle: { rateLimit: 100, burstLimit: 200 },
    });

    usagePlan.addApiKey(apiKey);

    const uploadRequestIntegration = new apigateway.LambdaIntegration(props.uploadRequestFn);

    const v1      = api.root.addResource('v1');
    const uploads = v1.addResource('uploads');
    const request = uploads.addResource('request');
    request.addMethod('POST', uploadRequestIntegration, { apiKeyRequired: true });

    this.url = api.url;
  }
}
