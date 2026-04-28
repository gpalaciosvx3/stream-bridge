# language: es

Característica: Parsear archivo subido

  El servicio reconcilia el estado del job, descarga el archivo desde S3,
  detecta el formato según la extensión, parsea con la estrategia
  correspondiente, calcula checksum y persiste el resultado en staging.

  Esquema del escenario: El archivo se parsea correctamente según su formato
    Dado el job "<jobId>" existe en estado PROCESSING
    Y el archivo "<key>" se descarga correctamente con contenido de "<rows>" filas
    Cuando se ejecuta el servicio con clientId "<clientId>" jobId "<jobId>" bucket "<bucket>" key "<key>"
    Entonces el archivo se sube a staging con prefijo "staging/<jobId>/"
    Y el job se transiciona a PARSED con sourceFormat "<sourceFormat>"
    Y la respuesta contiene checksum y totalRows "<rows>"

    Ejemplos:
      | clientId  | jobId   | bucket        | key                                                  | rows | sourceFormat |
      | ac-farma  | job-100 | stream-bridge | raw-uploads/ac-farma/2026-04-27/job-100/file.csv     | 3    | csv          |
      | prima-afp | job-101 | stream-bridge | raw-uploads/prima-afp/2026-04-27/job-101/aportes.txt | 2    | txt          |

  Escenario: El job se reconcilia desde PENDING a PROCESSING antes de parsear
    Dado el job "job-200" existe en estado PENDING
    Y el archivo "raw-uploads/ac-farma/2026-04-27/job-200/file.csv" se descarga correctamente con contenido de "1" filas
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-200" bucket "stream-bridge" key "raw-uploads/ac-farma/2026-04-27/job-200/file.csv"
    Entonces el job se transiciona a PROCESSING como reconciliación
    Y el job se transiciona a PARSED con sourceFormat "csv"

  Escenario: El job no existe en la base de datos
    Dado el job "job-404" no existe en la base de datos
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-404" bucket "stream-bridge" key "raw-uploads/ac-farma/2026-04-27/job-404/file.csv"
    Entonces el servicio falla con código "JOB-004"

  Escenario: El archivo descargado no contiene filas de datos
    Dado el job "job-300" existe en estado PROCESSING
    Y el archivo "raw-uploads/ac-farma/2026-04-27/job-300/file.csv" se descarga correctamente con contenido de "0" filas
    Cuando se ejecuta el servicio con clientId "ac-farma" jobId "job-300" bucket "stream-bridge" key "raw-uploads/ac-farma/2026-04-27/job-300/file.csv"
    Entonces el servicio falla con código "PARSER-002"

  Esquema del escenario: La factory rechaza extensiones no soportadas
    Cuando se detecta el formato para la key "<key>"
    Entonces la detección falla con código "<code>"

    Ejemplos:
      | key                  | code       |
      | archivo.pdf          | PARSER-001 |
      | archivo.json         | PARSER-001 |
      | archivo-sin-extension| PARSER-001 |

  Esquema del escenario: La factory crea la estrategia correcta según el formato
    Cuando se detecta el formato para la key "<key>"
    Entonces el formato detectado es "<format>"

    Ejemplos:
      | key             | format |
      | data.csv        | csv    |
      | data.xlsx       | excel  |
      | data.xls        | excel  |
      | data.xml        | xml    |
      | data.txt        | txt    |
      | DATA.CSV        | csv    |

  Esquema del escenario: Cada estrategia parsea su formato propio
    Cuando se parsea el contenido "<contenido>" con la estrategia "<estrategia>"
    Entonces el resultado tiene "<rows>" filas
    Y la primera fila contiene el campo "nombre" con valor "Juan"

    Ejemplos:
      | estrategia | contenido                                                               | rows |
      | csv        | nombre,edad\nJuan,30\nMaria,25                                          | 2    |
      | txt-pipe   | nombre\|edad\nJuan\|30\nMaria\|25                                       | 2    |
      | txt-tab    | nombre\tedad\nJuan\t30\nMaria\t25                                       | 2    |
      | xml        | <root><items><nombre>Juan</nombre><edad>30</edad></items></root>        | 1    |

  Esquema del escenario: La entidad rechaza inputs incompletos de Step Functions
    Cuando se construye la entidad con clientId "<clientId>" jobId "<jobId>" bucket "<bucket>" key "<key>"
    Entonces la construcción falla con código "PARSER-003"

    Ejemplos:
      | clientId | jobId   | bucket | key      |
      |          | job-001 | bucket | a/b/c.csv|
      | ac-farma |         | bucket | a/b/c.csv|
      | ac-farma | job-001 |        | a/b/c.csv|
      | ac-farma | job-001 | bucket |          |
