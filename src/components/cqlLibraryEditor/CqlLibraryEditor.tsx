import React from "react";
import "styled-components/macro";
import { EditorAnnotation, MadieCqlEditor } from "@madie/madie-editor";
import * as _ from "lodash";
import { ElmTranslationError } from "./editorUtil";
import { IconButton } from "@mui/material";
import Search from "@mui/icons-material/Search";
import useServiceConfig from "../../api/useServiceConfig";

export interface CqlLibraryEditorProps {
  valuesetMsg: string;
  inboundAnnotations: any;
  valuesetSuccess: boolean;
  onChange: (val: string) => void;
  value: string;
  readOnly?: boolean;
  setOutboundAnnotations: any;
}

export const mapElmErrorsToMonacoAnnotations = (
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
  const serviceConfig = useServiceConfig();
  return (
    <>
      <MadieCqlEditor
        serviceConfig={serviceConfig}
        onChange={onChange}
        value={value}
        inboundAnnotations={inboundAnnotations}
        height="100%"
        readOnly={readOnly}
        setOutboundAnnotations={setOutboundAnnotations}
      />
      {!valuesetSuccess && (
        <p
          className="cl:text-sm cl:font-medium cl:text-red-800"
          data-testid="valueset-error"
        >
          {valuesetMsg}
        </p>
      )}
      {valuesetSuccess && (
        <p
          className="cl:text-sm cl:font-medium cl:text-green-800"
          data-testid="valueset-success"
        >
          {valuesetMsg}
        </p>
      )}
    </>
  );
};
export default CqlLibraryEditor;
