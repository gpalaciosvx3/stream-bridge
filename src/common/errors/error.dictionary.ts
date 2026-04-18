import { HttpStatus } from '@nestjs/common';

export type InputError = {
  readonly code: string;
  readonly descripcion: string;
  readonly statusCode: number;
};

export class ErrorDictionary {
  static readonly INTERNAL_ERROR: InputError = {
    code: 'APP-001',
    descripcion: 'Ocurrió un error inesperado',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  };

  static readonly ENV_VAR_MISSING: InputError = {
    code: 'APP-002',
    descripcion: 'Variable de entorno requerida no encontrada',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  };

  static readonly VALIDATION_ERROR: InputError = {
    code: 'APP-003',
    descripcion: 'El cuerpo de la solicitud no es válido',
    statusCode: HttpStatus.BAD_REQUEST,
  };

  static readonly INVALID_CLIENT_ID: InputError = {
    code: 'JOB-001',
    descripcion: 'El clientId no puede estar vacío',
    statusCode: HttpStatus.BAD_REQUEST,
  };

  static readonly INVALID_FILENAME: InputError = {
    code: 'JOB-002',
    descripcion: 'El nombre de archivo contiene caracteres no permitidos',
    statusCode: HttpStatus.BAD_REQUEST,
  };

  static readonly INVALID_CONTENT_TYPE: InputError = {
    code: 'JOB-003',
    descripcion: 'El tipo de contenido no está soportado',
    statusCode: HttpStatus.BAD_REQUEST,
  };

  static readonly JOB_NOT_FOUND: InputError = {
    code: 'JOB-004',
    descripcion: 'El job solicitado no existe',
    statusCode: HttpStatus.NOT_FOUND,
  };
}
