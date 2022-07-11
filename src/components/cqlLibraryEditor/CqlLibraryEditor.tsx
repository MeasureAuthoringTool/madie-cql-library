import React, { useState, useEffect } from "react";
import "styled-components/macro";
import {
  EditorAnnotation,
  MadieEditor,
  parseContent,
  translateContent,
} from "@madie/madie-editor";
import * as _ from "lodash";
import useElmTranslationServiceApi, {
  ElmTranslation,
  ElmTranslationError,
  ElmValueSet,
} from "../../api/useElmTranslationServiceApi";
import tw from "twin.macro";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;

export interface CqlLibraryEditorProps {
  setDisplayAnnotations: (val: boolean) => void;
  setElmTranslationError: (val: string) => void;
  setSuccessMessage: (val: string) => void;
  setExecuteCqlParsing: (val: boolean) => void;
  setErrorResults: (val: object) => void;
  onChange: (val: string) => void;
  displayAnnotations: boolean;
  value: string;
  readOnly?: boolean;
  executeCqlParsing: boolean;
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
  setDisplayAnnotations,
  setElmTranslationError,
  setSuccessMessage,
  setExecuteCqlParsing,
  setErrorResults,
  onChange,
  displayAnnotations,
  value,
  readOnly,
  executeCqlParsing,
}: CqlLibraryEditorProps) => {
  const [valuesetMsg, setValuesetMsg] = useState(null);
  const [valuesetSuccess, setValuesetSuccess] = useState(true);

  const hasParserErrors = async (cql) => {
    return !!(parseContent(cql)?.length > 0);
  };
  const getTranslationResult = async (val) => {
    return await translateContent(val);
  };

  useEffect(() => {
    if (executeCqlParsing) {
      executeCqlParsingForErrors(value);
    }
  }, [executeCqlParsing]);

  const executeCqlParsingForErrors = async (cql: string) => {
    const results = await Promise.allSettled([
      getTranslationResult(cql),
      hasParserErrors(cql),
    ]);
    setErrorResults(results);
    setExecuteCqlParsing(false);
  };

  useEffect(() => {
    getTranslationResult(value)
      .then((data) => {})
      .catch((err) => {
        console.error("An error occurred while translating CQL to ELM", err);
        setElmTranslationError("Unable to translate CQL to ELM!");
      });
  }, [displayAnnotations]);

  const handleMadieEditorValue = (val: string) => {
    setElmTranslationError(undefined);
    setDisplayAnnotations(false);
    setSuccessMessage(undefined);
    onChange(val);
    setValuesetMsg(undefined);
    setValuesetSuccess(false);
  };

  return (
    <>
      <MadieEditor
        onChange={(val: string) => handleMadieEditorValue(val)}
        value={value}
        height="780px"
        readOnly={readOnly}
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
