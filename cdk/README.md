# StreamBridge — CDK

Infraestructura AWS del proyecto `stream-bridge`, definida con AWS CDK (TypeScript).

---

## Índice

- [Estructura](#estructura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo en LocalStack](#desarrollo-en-localstack)
- [Despliegue en AWS](#despliegue-en-aws)
- [Comandos de referencia](#comandos-de-referencia)
- [Stages y configuración](#stages-y-configuración)
- [Recursos desplegados](#recursos-desplegados)
- [Outputs del stack](#outputs-del-stack)

---

## Estructura

```
cdk/
  bin/
    app.ts              # Entry point — resuelve stage → config → stack
  lib/
    app.stack.ts        # Stack principal
    constructs/
      api-gateway/      # REST API v1, API Key, Usage Plan
      cloudwatch/       # Log groups por Lambda
      dynamo/           # Tabla de jobs con TTL y GSIs
      iam/              # Roles de ejecución por Lambda
      lambda/           # Una construct por función Lambda
      s3/               # Bucket de pipeline (raw / staging / processed)
  common/
    constants/          # NamingConstants, ResourceConstants, InfraConstants
    stages/             # local.stage.ts, dev.stage.ts
    types/              # StageConfig
  docker-compose.yml    # LocalStack Pro para desarrollo local
```

---

## Requisitos

- Node.js 20+
- Docker (para LocalStack)
- `LOCALSTACK_AUTH_TOKEN` en `.env` (LocalStack Pro)

---

## Instalación

```bash
cd cdk && npm install

# CLI globales (una sola vez)
npm install -g aws-cdk aws-cdk-local
pip install awscli-local
```

---

## Desarrollo en LocalStack

> Copiar `.env.example` a `.env` y completar `LOCALSTACK_AUTH_TOKEN`.

```bash
# Levantar LocalStack
docker compose up -d

# Bootstrap (una vez por contenedor nuevo)
cdklocal bootstrap

# Deploy
CDK_STAGE=local cdklocal deploy --require-approval never

# Destruir
cdklocal destroy --force
```

### Scripts disponibles

```bash
npm run setup:local      # bootstrap + deploy
npm run deploy:local     # solo deploy
npm run diff:local       # diff
npm run destroy:local    # destruir stack
```

---

## Despliegue en AWS

```bash
# Bootstrap (una vez por cuenta/región)
CDK_STAGE=dev cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# Preview
CDK_STAGE=dev cdk diff

# Deploy
CDK_STAGE=dev cdk deploy --require-approval never
```

### Scripts disponibles

```bash
npm run deploy:dev       # deploy a AWS DEV
npm run diff:dev         # diff en AWS DEV
```

---

## Comandos de verificación

### DynamoDB

```bash
# Describir tabla (confirmar TTL, GSIs, billing mode)
awslocal dynamodb describe-table \
  --table-name UE1STREAMBRIDGEDDB001 \
  --query 'Table.{Status:TableStatus,TTL:TimeToLiveDescription,GSIs:GlobalSecondaryIndexes[*].IndexName}'

awslocal dynamodb describe-table \
  --table-name UE1STREAMBRIDGEDDB002 \
  --query 'Table.{Status:TableStatus,TTL:TimeToLiveDescription,GSIs:GlobalSecondaryIndexes[*].IndexName}'

# Escanear items (verificar escritura desde upload-request)
awslocal dynamodb scan --table-name UE1STREAMBRIDGEDDB001 
awslocal dynamodb scan --table-name UE1STREAMBRIDGEDDB002 
```

### S3

```bash
# Listar buckets (confirmar creación)
awslocal s3 ls

# Listar prefijos del bucket de pipeline
awslocal s3 ls s3://ue1streambridges3001/
awslocal s3 ls s3://ue1streambridges3001/raw-uploads/ --recursive
```

### Lambda

```bash
# Listar funciones
awslocal lambda list-functions \
  --query 'Functions[*].{Name:FunctionName,State:State}'
```

### API Gateway

```bash
# Listar APIs (obtener api-id)
awslocal apigateway get-rest-apis \
  --query 'items[*].{id:id,name:name}'

# Listar rutas desplegadas
awslocal apigateway get-resources \
  --rest-api-id <api-id> \
  --query 'items[*].{path:path,methods:resourceMethods}'
```

### IAM

```bash
# Verificar políticas del rol de upload-request
awslocal iam get-role-policy \
  --role-name UE1STBROL001 \
  --policy-name S3PutRawUploads

awslocal iam get-role-policy \
  --role-name UE1STBROL001 \
  --policy-name DynamoDbPutJob
```

---

## Stages y configuración

| Stage | Branch | Cuenta |
|---|---|---|
| `local` | `local` | `000000000000` (LocalStack) |
| `dev` | `develop` | `CDK_DEFAULT_ACCOUNT` |
| `qa` | `release` | pendiente |
| `prd` | `master` | pendiente |

El stage se controla con la variable de entorno `CDK_STAGE`:

```bash
CDK_STAGE=dev cdk deploy ...
```

Para agregar un nuevo stage: crear `cdk/common/stages/qa.stage.ts` y extender el `switch` en `bin/app.ts`.

---

## Recursos desplegados

| Recurso | Construct | Nombre físico |
|---|---|---|
| Lambda upload-request | `UploadRequestFnConstruct` | `UE1STREAMBRIDGELMB001` |
| DynamoDB jobs table | `JobsTableConstruct` | `UE1STREAMBRIDGEDDB001` |
| S3 pipeline bucket | `PipelineBucketConstruct` | `ue1streambridges3001` |
| API Gateway REST | `HttpApiConstruct` | `UE1STREAMBRIDGEGTW001` |
| IAM Role upload-request | `UploadRequestRoleConstruct` | `UE1STREAMBRIDGEROL001` |

---

## Outputs del stack

| Output | Descripción |
|---|---|
| `ApiUrl` | URL base del API Gateway |
