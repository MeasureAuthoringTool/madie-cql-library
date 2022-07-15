export type ElmTranslationError = {
  startLine: number;
  startChar: number;
  endChar: number;
  endLine: number;
  errorSeverity: string;
  errorType: string;
  message: string;
  targetIncludeLibraryId: string;
  targetIncludeLibraryVersionId: string;
  type: string;
};

export type ElmTranslationLibrary = {
  annotation: any[];
  contexts: any;
  identifier: any;
  parameters: any;
  schemaIdentifier: any;
  statements: any;
  usings: any;
  valueSets?: any;
};

export type ElmTranslation = {
  errorExceptions: ElmTranslationError[];
  externalErrors: any[];
  library: ElmTranslationLibrary;
};

export type ElmValueSet = {
  localId: any;
  locator: any;
  name: any;
  id: any;
};

export type FHIRValueSet = {
  resourceType: string;
  id: string;
  url: string;
  status: string;
  errorMsg: string;
};
