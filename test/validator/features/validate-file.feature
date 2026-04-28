# language: es

Característica: Validar archivo parseado contra schema del cliente

  El servicio verifica precondiciones (job y schema), descarga el archivo
  parseado, valida cada fila contra el schema Zod del cliente, genera el
  reporte y actualiza el estado del job según la política configurada.

  Escenario: El archivo pasa la validación con política STRICT sin errores
    Dado el job "job-100" existe en estado PARSED
    Y el cliente "ac-farma" tiene un schema activo con política STRICT
    Y el archivo parseado tiene 2 filas válidas
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-100" stagedKey "staging/job-100/parsed.json" checksum "abc"
    Entonces el reporte se sube a S3
    Y el job se transiciona a VALIDATED
    Y la respuesta indica passed true

  Escenario: El archivo falla la validación con política STRICT por una sola fila inválida
    Dado el job "job-101" existe en estado PARSED
    Y el cliente "ac-farma" tiene un schema activo con política STRICT
    Y el archivo parseado tiene 1 fila válida y 1 fila inválida
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-101" stagedKey "staging/job-101/parsed.json" checksum "abc"
    Entonces el servicio falla con código "VALIDATOR-002"
    Y el job se transiciona a VALIDATION_FAILED

  Esquema del escenario: La política LENIENT pasa o falla según el umbral
    Dado el job "<jobId>" existe en estado PARSED
    Y el cliente "ac-farma" tiene un schema activo con política LENIENT y umbral <umbral>
    Y el archivo parseado tiene <validas> filas válidas y <invalidas> filas inválidas
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "<jobId>" stagedKey "staging/<jobId>/parsed.json" checksum "abc"
    Entonces el resultado de la validación es "<resultado>"

    Ejemplos:
      | jobId   | umbral | validas | invalidas | resultado |
      | job-200 | 50     | 8       | 2         | passed    |
      | job-201 | 50     | 4       | 6         | failed    |
      | job-202 | 10     | 9       | 1         | passed    |
      | job-203 | 10     | 8       | 2         | failed    |

  Esquema del escenario: El servicio rechaza estados de job no válidos para entrar
    Dado el job "<jobId>" existe en estado <status>
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "<jobId>" stagedKey "staging/<jobId>/parsed.json" checksum "abc"
    Entonces el servicio falla con código "JOB-007"

    Ejemplos:
      | jobId   | status     |
      | job-301 | PENDING    |
      | job-302 | PROCESSING |
      | job-303 | DONE       |

  Escenario: El job no existe en la base de datos
    Dado el job "job-404" no existe en la base de datos
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-404" stagedKey "staging/job-404/parsed.json" checksum "abc"
    Entonces el servicio falla con código "JOB-004"

  Escenario: El cliente no tiene schema activo
    Dado el job "job-500" existe en estado PARSED
    Y el cliente "ac-farma" no tiene un schema activo
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-500" stagedKey "staging/job-500/parsed.json" checksum "abc"
    Entonces el servicio falla con código "VALIDATOR-001"

  Esquema del escenario: La entidad rechaza inputs incompletos de Step Functions
    Cuando se construye la entidad de validación con clientId "<clientId>" jobId "<jobId>" stagedKey "<stagedKey>" checksum "<checksum>"
    Entonces la construcción falla con código "PARSER-003"

    Ejemplos:
      | clientId | jobId   | stagedKey                | checksum |
      |          | job-001 | staging/job-001/parsed.json | abc   |
      | ac-farma |         | staging/job-001/parsed.json | abc   |
      | ac-farma | job-001 |                             | abc   |
      | ac-farma | job-001 | staging/job-001/parsed.json |       |
