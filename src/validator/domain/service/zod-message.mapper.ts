import { z } from 'zod';
import { ValidatorConstants } from '../constants/validator.constants';

export class ZodMessageMapper {
  static translate(issue: z.ZodIssue): string {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        return ValidatorConstants.ZOD_MSG_INVALID_TYPE(issue.expected, issue.received);
      case z.ZodIssueCode.too_small:
        return ValidatorConstants.ZOD_MSG_TOO_SMALL(issue.minimum);
      case z.ZodIssueCode.too_big:
        return ValidatorConstants.ZOD_MSG_TOO_BIG(issue.maximum);
      case z.ZodIssueCode.invalid_string:
        return ValidatorConstants.ZOD_MSG_INVALID_STRING;
      case z.ZodIssueCode.invalid_enum_value:
        return ValidatorConstants.ZOD_MSG_INVALID_ENUM(issue.options);
      default:
        return issue.message;
    }
  }
}
