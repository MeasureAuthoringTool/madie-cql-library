import React, { useState, useEffect } from "react";
import "styled-components/macro";
import { EditorAnnotation, MadieEditor } from "@madie/madie-editor";
import * as _ from "lodash";
import useElmTranslationServiceApi, {
  ElmTranslation,
  ElmTranslationError,
} from "../../api/useElmTranslationServiceApi";

export interface CqlLibraryEditorProps {
  displayAnnotations: boolean;
  setDisplayAnnotations: (val: boolean) => void;
  setElmTranslationError: (val: string) => void;
  setCqlErrors: (val: boolean) => void;
  setSuccessMessage: (val: string) => void;
  setHandleClick: (val: boolean) => void;
  setParseErrors: (val: boolean) => void;
  parseErrors: boolean;
  handleClick: boolean;
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
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
  displayAnnotations,
  setDisplayAnnotations,
  setElmTranslationError,
  setCqlErrors,
  setSuccessMessage,
  setHandleClick,
  setParseErrors,
  parseErrors,
  handleClick,
  value,
  onChange,
  readOnly,
}: CqlLibraryEditorProps) => {
  const elmTranslationServiceApi = useElmTranslationServiceApi();
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);

  const updateElmAnnotations = async (cql: string): Promise<ElmTranslation> => {
    if (handleClick) {
      if (cql && cql.trim().length > 0) {
        const data = await elmTranslationServiceApi.translateCqlToElm(cql);
        const elmAnnotations = mapElmErrorsToAceAnnotations(
          data?.errorExceptions
        );
        if (elmAnnotations.length > 0) {
          setElmAnnotations(elmAnnotations);
          setCqlErrors(true);
        } else {
          setElmAnnotations(elmAnnotations);
          setCqlErrors(false);
        }
      } else {
        setElmAnnotations([]);
        setCqlErrors(false);
      }
      return null;
    }
  };

  useEffect(() => {
    if (displayAnnotations) {
      if (value?.length === 0) {
        setParseErrors(false);
      }
      if (parseErrors !== undefined) {
        updateElmAnnotations(value)
          .then(() => {
            setHandleClick(false);
          })
          .catch((err) => {
            console.error(
              "An error occurred while translating CQL to ELM",
              err
            );
            setElmTranslationError("Unable to translate CQL to ELM!");
            setElmAnnotations([]);
            setCqlErrors(true);
            setHandleClick(false);
          });
      }
    }
  }, [value, displayAnnotations, handleClick, parseErrors]);

  const handleMadieEditorValue = (val: string) => {
    setElmTranslationError(undefined);
    setDisplayAnnotations(false);
    setSuccessMessage(undefined);
    onChange(val);
    setParseErrors(undefined);
  };

  return (
    <>
      <MadieEditor
        onChange={(val: string) => handleMadieEditorValue(val)}
        value={value}
        setParseErrors={setParseErrors}
        handleClick={handleClick}
        inboundAnnotations={displayAnnotations ? elmAnnotations : []}
        height="780px"
        readOnly={readOnly}
      />
    </>
  );
};

export default CqlLibraryEditor;
