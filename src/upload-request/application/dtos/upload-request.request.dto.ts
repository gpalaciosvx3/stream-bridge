import { z } from 'zod';
import { UploadRequestConstants } from '../../domain/constants/upload-request.constants';

export const UploadRequestRequestDto = z.object({
  clientId: z.string().min(1),
  filename: z
    .string()
    .min(1)
    .refine(name => !name.includes('../') && !name.includes('/'), {
      message: 'El nombre de archivo no puede contener separadores de ruta',
    }),
  contentType: z.enum(UploadRequestConstants.ALLOWED_CONTENT_TYPES),
});

export type UploadRequestRequestDtoType = z.infer<typeof UploadRequestRequestDto>;
