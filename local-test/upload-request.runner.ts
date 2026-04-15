import 'dotenv/config';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/upload-request/infrastructure/bootstrap/upload-request.handler';

const event: APIGatewayProxyEventV2 = {
  version: '2.0',
  routeKey: 'POST /uploads/request',
  rawPath: '/uploads/request',
  rawQueryString: '',
  headers: { 'content-type': 'application/json' },
  requestContext: {
    accountId: '000000000000',
    apiId: 'local',
    domainName: 'localhost',
    domainPrefix: 'local',
    http: { method: 'POST', path: '/uploads/request', protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'local-runner' },
    requestId: 'local-req-upload-request',
    routeKey: 'POST /uploads/request',
    stage: '$default',
    time: new Date().toISOString(),
    timeEpoch: Date.now(),
  },
  body: JSON.stringify({
    clientId: 'ac-farma',
    filename: 'inventario-dist-norte.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }),
  isBase64Encoded: false,
};

handler(event).then(result => {
  console.log('status:', result.statusCode);
  console.log('body:  ', JSON.parse(result.body));
}).catch(console.error);
