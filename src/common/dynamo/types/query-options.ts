export interface QueryOptions {
  index?:             string;
  keyCondition:       string;
  filterExpression?:  string;
  attributeNames?:    Record<string, string>;
  attributeValues:    Record<string, unknown>;
}
