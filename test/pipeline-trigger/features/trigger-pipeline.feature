# language: es

Característica: Disparar pipeline desde evento S3

  El servicio recibe el body crudo de un mensaje SQS (que envuelve un evento S3),
  construye la entidad, consulta el job en DynamoDB, inicia la ejecución de
  Step Functions y actualiza el estado del job a PROCESSING.

  Esquema del escenario: El evento S3 dispara el pipeline correctamente
    Dado el job "<jobId>" existe en estado PENDING
    Y Step Functions inicia la ejecución correctamente
    Cuando se procesa un evento S3 con bucket "<bucket>" key "<key>"
    Entonces el job se transiciona a PROCESSING
    Y se inicia la ejecución en Step Functions

    Ejemplos:
      | bucket          | key                                                  | jobId                                |
      | stream-bridge   | raw-uploads/ac-farma/2026-04-27/job-001/file.csv     | job-001                              |
      | stream-bridge   | raw-uploads/prima-afp/2026-04-27/job-002/aportes.xml | job-002                              |

  Esquema del escenario: El job ya no está en estado PENDING
    Dado el job "<jobId>" existe en estado <status>
    Cuando se procesa un evento S3 con bucket "stream-bridge" key "raw-uploads/ac-farma/2026-04-27/<jobId>/file.csv"
    Entonces no se inicia ninguna ejecución en Step Functions
    Y no se transiciona el estado del job

    Ejemplos:
      | jobId   | status     |
      | job-010 | PROCESSING |
      | job-011 | PARSED     |
      | job-012 | DONE       |
      | job-013 | FAILED     |

  Escenario: El job no existe en la base de datos
    Dado el job "job-404" no existe en la base de datos
    Cuando se procesa un evento S3 con bucket "stream-bridge" key "raw-uploads/ac-farma/2026-04-27/job-404/file.csv"
    Entonces no se inicia ninguna ejecución en Step Functions
    Y no se transiciona el estado del job

  Escenario: Step Functions reporta ejecución duplicada
    Dado el job "job-020" existe en estado PENDING
    Y Step Functions reporta que la ejecución ya existe
    Cuando se procesa un evento S3 con bucket "stream-bridge" key "raw-uploads/ac-farma/2026-04-27/job-020/file.csv"
    Entonces no se transiciona el estado del job

  Escenario: El evento de prueba de S3 se ignora
    Cuando se procesa un evento de prueba "s3:TestEvent"
    Entonces no se consulta la base de datos
    Y no se inicia ninguna ejecución en Step Functions

  Esquema del escenario: La entidad rechaza eventos S3 malformados
    Cuando se construye la entidad con un evento del tipo "<tipo>"
    Entonces la construcción falla con código "<code>"

    Ejemplos:
      | tipo                     | code     |
      | sin records              | APP-001  |
      | sin bucket name          | APP-001  |
      | sin object key           | APP-001  |
      | key con menos de 5 partes| JOB-005  |
