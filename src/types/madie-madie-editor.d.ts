declare module "@madie/madie-editor" {
  import { FC } from "react";
  import { LifeCycleFn } from "single-spa";

  export type EditorAnnotation = {
    row?: number;
    column?: number;
    text: string;
    type: string;
  };

  export interface LineInfo {
    line: number;
    position: number;
  }

  export interface CqlError {
    text?: string;
    name?: string;
    start?: LineInfo;
    stop?: LineInfo;
    message: string;
  }

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

  export interface AllErrorsResult {
    translation: ElmTranslation;
    errors: ElmTranslationError[];
  }

  export type ElmTranslation = {
    errorExceptions: ElmTranslationError[];
    externalErrors: any[];
    library: ElmTranslationLibrary;
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

  export const parseContent: (content: string) => CqlError[];
  export const validateContent: (content: string) => Promise<AllErrorsResult>;

  export const MadieEditor: FC<{
    value: string;
    onChange: (value: string) => void;
    parseDebounceTime?: number;
    inboundAnnotations?: EditorAnnotation[];
    height?: string;
    readOnly?: boolean;
  }>;
  export const bootstrap: LifeCycleFn<void>;
  export const mount: LifeCycleFn<void>;
  export const unmount: LifeCycleFn<void>;
}
