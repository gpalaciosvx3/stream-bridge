# language: es

Característica: Cargar archivo procesado al destino final

  El servicio verifica precondiciones, aplica idempotencia por checksum,
  descarga el archivo parseado y el reporte, separa filas válidas e
  inválidas, sube el resultado final a S3 y marca el job como DONE.

  Escenario: El archivo se carga correctamente desde estado VALIDATED
    Dado el job "job-100" existe en estado VALIDATED con checksum "abc"
    Y el archivo parseado tiene 3 filas
    Y el reporte de validación marca la fila 2 como inválida
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-100" stagedKey "staging/job-100/parsed.json" checksum "abc"
    Entonces el archivo procesado se sube a S3
    Y el archivo procesado contiene 2 filas válidas y 1 fila inválida
    Y el job se transiciona a DONE

  Escenario: El job ya fue procesado con el mismo checksum (idempotencia)
    Dado el job "job-200" existe en estado DONE con checksum "abc"
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-200" stagedKey "staging/job-200/parsed.json" checksum "abc"
    Entonces el archivo procesado no se sube a S3
    Y el job no se actualiza nuevamente
    Y la respuesta indica status DONE

  Escenario: El job está DONE pero con un checksum diferente
    Dado el job "job-201" existe en estado DONE con checksum "viejo"
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-201" stagedKey "staging/job-201/parsed.json" checksum "nuevo"
    Entonces el servicio falla con código "JOB-007"

  Esquema del escenario: El servicio rechaza estados de job no válidos para entrar
    Dado el job "<jobId>" existe en estado <status> con checksum "abc"
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "<jobId>" stagedKey "staging/<jobId>/parsed.json" checksum "abc"
    Entonces el servicio falla con código "JOB-007"

    Ejemplos:
      | jobId   | status     |
      | job-301 | PENDING    |
      | job-302 | PROCESSING |
      | job-303 | PARSED     |

  Escenario: El job no existe en la base de datos
    Dado el job "job-404" no existe en la base de datos
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-404" stagedKey "staging/job-404/parsed.json" checksum "abc"
    Entonces el servicio falla con código "JOB-004"

  Esquema del escenario: La entidad rechaza inputs incompletos de Step Functions
    Cuando se construye la entidad de carga con clientId "<clientId>" jobId "<jobId>" stagedKey "<stagedKey>" checksum "<checksum>"
    Entonces la construcción falla con código "PARSER-003"

    Ejemplos:
      | clientId | jobId   | stagedKey                   | checksum |
      |          | job-001 | staging/job-001/parsed.json | abc      |
      | ac-farma |         | staging/job-001/parsed.json | abc      |
      | ac-farma | job-001 |                             | abc      |
      | ac-farma | job-001 | staging/job-001/parsed.json |          |
