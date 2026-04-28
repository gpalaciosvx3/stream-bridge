# language: es

Característica: Crear solicitud de subida

  El caso de uso recibe un body crudo, lo valida contra el DTO,
  delega al servicio de dominio, verifica idempotencia, genera la
  presigned URL y persiste el job en estado PENDING.

  Esquema del escenario: El cliente solicita una subida con datos válidos
    Dado el cliente "<clientId>" no tiene jobs activos para "<filename>"
    Y el repositorio de S3 genera la URL "<url>"
    Cuando se ejecuta el caso de uso con clientId "<clientId>" filename "<filename>" contentType "<contentType>"
    Entonces la respuesta tiene la URL "<url>"
    Y la respuesta tiene un jobId
    Y el job se persiste con status PENDING
    Y el job persistido contiene la sourceKey con prefijo "<sourceKeyPrefix>"

    Ejemplos:
      | clientId  | filename       | contentType                                                       | url                          | sourceKeyPrefix        |
      | ac-farma  | inventario.csv | text/csv                                                          | https://s3.local/upload/csv  | raw-uploads/ac-farma/  |
      | prima-afp | aportes.xlsx   | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | https://s3.local/upload/xlsx | raw-uploads/prima-afp/ |
      | prima-afp | aportes.xml    | application/xml                                                   | https://s3.local/upload/xml  | raw-uploads/prima-afp/ |

  Esquema del escenario: El DTO rechaza el input por formato inválido
    Cuando se ejecuta el caso de uso con un body inválido del tipo "<tipo>"
    Entonces la ejecución falla con código "<code>"
    Y el job no se persiste

    Ejemplos:
      | tipo                 | code    |
      | sin filename         | APP-003 |
      | sin clientId         | APP-003 |
      | sin contentType      | APP-003 |
      | body no es objeto    | APP-003 |
      | filename con ruta    | APP-003 |
      | contentType inválido | APP-003 |

  Esquema del escenario: La entidad rechaza invariantes de dominio
    Cuando se construye la entidad con clientId "<clientId>" filename "<filename>" contentType "<contentType>"
    Entonces la construcción falla con código "<code>"

    Ejemplos:
      | clientId | filename       | contentType              | code    |
      |          | inventario.csv | text/csv                 | JOB-001 |
      | ac-farma | ../etc/passwd  | text/csv                 | JOB-002 |
      | ac-farma | sub/file.csv   | text/csv                 | JOB-002 |
      | ac-farma | archivo.bin    | application/octet-stream | JOB-003 |

  Esquema del escenario: Ya existe un job activo para el mismo cliente y filename
    Dado el cliente "<clientId>" tiene un job activo para "<filename>"
    Cuando se ejecuta el caso de uso con clientId "<clientId>" filename "<filename>" contentType "<contentType>"
    Entonces la ejecución falla con código "<code>"
    Y el job no se persiste

    Ejemplos:
      | clientId  | filename       | contentType     | code    |
      | ac-farma  | inventario.csv | text/csv        | JOB-006 |
      | prima-afp | aportes.xml    | application/xml | JOB-006 |

