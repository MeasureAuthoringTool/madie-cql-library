import React, { useState, useEffect } from "react";
import "styled-components/macro";
import { EditorAnnotation, MadieEditor } from "@madie/madie-editor";
import * as _ from "lodash";
import useElmTranslationServiceApi, {
  ElmTranslation,
  ElmTranslationError,
  ElmValueSet,
} from "../../api/useElmTranslationServiceApi";
import useTerminologyServiceApi from "../../api/useTerminologyServiceApi";
import tw from "twin.macro";

const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;

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
  const terminologyServiceApi = useTerminologyServiceApi();
  const [valuesetMsg, setValuesetMsg] = useState(null);
  const [valuesetSuccess, setValuesetSuccess] = useState(true);

  const updateElmAnnotations = async (cql: string): Promise<ElmTranslation> => {
    if (handleClick) {
      if (cql && cql.trim().length > 0) {
        const data = await elmTranslationServiceApi.translateCqlToElm(cql);

        let valuesetsErrors = null;
        const tgt = getTgt();
        const tgtValue = getTgtValue(tgt);
        if (data.library?.valueSets?.def !== null) {
          if (tgt && tgtValue && tgtValue !== "") {
            valuesetsErrors = await getValueSetErrors(
              data.library?.valueSets?.def,
              tgtValue
            );
          } else {
            setValuesetMsg("Please log in to UMLS!");
            setValuesetSuccess(false);
            window.localStorage.removeItem("TGT");
          }
        }

        const allErrorsArray: ElmTranslationError[] = data?.errorExceptions
          ? data?.errorExceptions
          : [];

        if (valuesetsErrors && valuesetsErrors.length > 0) {
          valuesetsErrors.map((valueSet, i) => {
            allErrorsArray.push(valueSet);
          });
        } else {
          if (tgtValue) {
            setValuesetSuccess(true);
            setValuesetMsg("Value Set is valid!");
          }
        }

        const elmAnnotations = mapElmErrorsToAceAnnotations(allErrorsArray);
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
    setValuesetMsg(undefined);
    setValuesetSuccess(false);
  };

  const getTgt = (): any => {
    return window.localStorage.getItem("TGT");
  };

  const getTgtValue = (tgt: any): any => {
    let tgtValue = null;
    if (tgt) {
      let tgtObjFromLocalStorage = JSON.parse(tgt);
      tgtValue = tgtObjFromLocalStorage.TGT;
    }
    return tgtValue;
  };

  const getValueSetErrors = async (
    valuesetsArray: ElmValueSet[],
    tgtValue: string
  ): Promise<ElmTranslationError[]> => {
    const valuesetsErrorArray: ElmTranslationError[] = [];
    if (valuesetsArray && tgtValue) {
      await Promise.allSettled(
        valuesetsArray.map(async (valueSet, i) => {
          const oid = getOid(valueSet);
          await terminologyServiceApi
            .getValueSet(tgtValue, oid, valueSet.locator)
            .then((response) => {
              if (response.errorMsg) {
                const vsErrorForElmTranslationError: ElmTranslationError =
                  processValueSetErrorForElmTranslationError(
                    response.errorMsg.toString(),
                    valueSet.locator
                  );
                valuesetsErrorArray.push(vsErrorForElmTranslationError);
              }
            });
        })
      );
      return valuesetsErrorArray;
    }
  };

  const getOid = (valueSet: ElmValueSet): string => {
    return valueSet.id.match(/[0-2](\.(0|[1-9][0-9]*))+/)[0];
  };

  const getStartLine = (locator: string): number => {
    const index = locator.indexOf(":");
    const startLine = locator.substring(0, index);
    return Number(startLine);
  };

  const getStartChar = (locator: string): number => {
    const index = locator.indexOf(":");
    const index2 = locator.indexOf("-");
    const startChar = locator.substring(index + 1, index2);
    return Number(startChar);
  };

  const getEndLine = (locator: string): number => {
    const index = locator.indexOf("-");
    const endLineAndChar = locator.substring(index + 1);
    const index2 = locator.indexOf(":");
    const endLine = endLineAndChar.substring(0, index2);
    return Number(endLine);
  };

  const getEndChar = (locator: string): number => {
    const index = locator.indexOf("-");
    const endLineAndChar = locator.substring(index + 1);
    const index2 = locator.indexOf(":");
    const endLine = endLineAndChar.substring(index2 + 1);
    return Number(endLine);
  };

  const processValueSetErrorForElmTranslationError = (
    vsError: string,
    valuesetLocator: string
  ): ElmTranslationError => {
    const startLine: number = getStartLine(valuesetLocator);
    const startChar: number = getStartChar(valuesetLocator);
    const endLine: number = getEndLine(valuesetLocator);
    const endChar: number = getEndChar(valuesetLocator);
    return {
      startLine: startLine,
      startChar: startChar,
      endChar: endChar,
      endLine: endLine,
      errorSeverity: "Error",
      errorType: "ValueSet",
      message: vsError,
      targetIncludeLibraryId: "",
      targetIncludeLibraryVersionId: "",
      type: "ValueSet",
    };
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
