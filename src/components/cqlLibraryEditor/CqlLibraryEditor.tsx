import React from "react";
import "styled-components/macro";
import { EditorAnnotation, MadieEditor } from "@madie/madie-editor";
import * as _ from "lodash";
import { ElmTranslationError } from "./editorUtil";

export interface CqlLibraryEditorProps {
  inboundAnnotations: any;
  onChange: (val: string) => void;
  value: string;
  readOnly?: boolean;
  setOutboundAnnotations: any;
}

export const mapElmErrorsToAceAnnotations = (
  errors: ElmTranslationError[]
): EditorAnnotation[] => {
  let annotations: EditorAnnotation[] = [];
  if (errors && _.isArray(errors) && errors.length > 0) {
    annotations = errors.map((error: ElmTranslationError) => ({
      row: error.startLine - 1,
      column: error.startChar,
      type: error.errorSeverity.toLowerCase(),
      text: `ELM: ${error.startChar}:${error.endChar} | ${error.message}`,
    }));
  }
  return annotations;
};
const CqlLibraryEditor = ({
  inboundAnnotations,
  onChange,
  value,
  readOnly,
  setOutboundAnnotations,
}: CqlLibraryEditorProps) => {
  return (
    <>
      <MadieEditor
        onChange={onChange}
        value={value}
        inboundAnnotations={inboundAnnotations}
        height="calc(100vh - 135px)"
        readOnly={readOnly}
        setOutboundAnnotations={setOutboundAnnotations}
      />
    </>
  );
};
export default CqlLibraryEditor;
