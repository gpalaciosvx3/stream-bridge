export class NamingConstants {
  private static readonly REGION  = 'UE1';
  private static readonly PROJECT = 'STREAMBRIDGE';

  static readonly LMB_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}LMB001`;
  static readonly LMB_002 = `${NamingConstants.REGION}${NamingConstants.PROJECT}LMB002`;
  static readonly LMB_003 = `${NamingConstants.REGION}${NamingConstants.PROJECT}LMB003`;

  static readonly DDB_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}DDB001`;
  static readonly DDB_002 = `${NamingConstants.REGION}${NamingConstants.PROJECT}DDB002`;

  static readonly S3_001  = `${NamingConstants.REGION}${NamingConstants.PROJECT}S3001`.toLowerCase();

  static readonly APG_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}GTW001`;

  static readonly SQS_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}SQS001`;
  static readonly SQS_002 = `${NamingConstants.REGION}${NamingConstants.PROJECT}SQS002`;

  static readonly SFN_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}SFN001`;

  static readonly ROL_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}ROL001`;
  static readonly ROL_002 = `${NamingConstants.REGION}${NamingConstants.PROJECT}ROL002`;
  static readonly ROL_003 = `${NamingConstants.REGION}${NamingConstants.PROJECT}ROL003`;
  static readonly ROL_006 = `${NamingConstants.REGION}${NamingConstants.PROJECT}ROL006`;
}
