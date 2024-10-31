import React from "react";
import "styled-components/macro";
import { EditorAnnotation, MadieEditor } from "@madie/madie-editor";
import * as _ from "lodash";
import { ElmTranslationError } from "./editorUtil";
import tw from "twin.macro";
import { IconButton } from "@mui/material";
import Search from "@mui/icons-material/Search";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;
export interface CqlLibraryEditorProps {
  valuesetMsg: string;
  inboundAnnotations: any;
  valuesetSuccess: boolean;
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
  valuesetSuccess,
  valuesetMsg,
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
      {!valuesetSuccess && (
        <ErrorText data-testid="valueset-error">{valuesetMsg}</ErrorText>
      )}
      {valuesetSuccess && (
        <SuccessText data-testid="valueset-success">{valuesetMsg}</SuccessText>
      )}
    </>
  );
};
export default CqlLibraryEditor;
