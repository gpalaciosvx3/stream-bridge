export class NamingConstants {
  private static readonly REGION  = 'UE1';
  private static readonly PROJECT = 'STREAMBRIDGE';

  static readonly LMB_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}LMB001`;

  static readonly DDB_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}DDB001`;

  static readonly S3_001  = `${NamingConstants.REGION}${NamingConstants.PROJECT}S3001`.toLowerCase();

  static readonly APG_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}GTW001`;
  
  static readonly ROL_001 = `${NamingConstants.REGION}${NamingConstants.PROJECT}ROL001`;
}
