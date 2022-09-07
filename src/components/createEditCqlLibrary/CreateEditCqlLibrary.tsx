import React, { useEffect, useRef, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { useHistory, useParams } from "react-router-dom";
import { useFormik } from "formik";
import { CqlLibrary, Model } from "@madie/madie-models";
import { CqlLibrarySchemaValidator } from "../../validators/CqlLibrarySchemaValidator";
import { Button, HelperText, Label, TextInput } from "@madie/madie-components";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import * as _ from "lodash";
import CqlLibraryEditor, {
  mapElmErrorsToAceAnnotations,
} from "../cqlLibraryEditor/CqlLibraryEditor";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";
import {
  EditorAnnotation,
  parseContent,
  synchingEditorCqlContent,
  validateContent,
  ElmTranslationError,
} from "@madie/madie-editor";

const SuccessText = tw.div`bg-green-200 rounded-lg py-3 px-3 text-green-900 mb-3`;
const WarningText = tw.div`bg-yellow-200 rounded-lg py-3 px-3 text-yellow-800 mb-3`;
const ErrorAlert = tw.div`bg-red-200 rounded-lg py-3 px-3 text-red-900 mb-3`;
const InfoAlert = tw.div`bg-blue-200 rounded-lg py-1 px-1 text-blue-900 mb-3`;
const FormRow = tw.div`mt-3`;

const CreateEditCqlLibrary = () => {
  const history = useHistory();
  // @ts-ignore
  const { id } = useParams();
  const [serverError, setServerError] = useState(undefined);
  const [loadedCqlLibrary, setLoadedCqlLibrary] = useState<CqlLibrary>(null);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [elmTranslationError, setElmTranslationError] = useState(undefined);
  const [successMessage, setSuccessMessage] = useState({
    status: undefined,
    message: undefined,
  });
  const [valuesetMsg, setValuesetMsg] = useState(null);
  const [valuesetSuccess, setValuesetSuccess] = useState<boolean>(true);
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);
  const formik = useFormik({
    initialValues: {
      cqlLibraryName: "",
      model: "",
      cql: "",
      draft: !!_.isNil(id),
    } as CqlLibrary,
    validationSchema: CqlLibrarySchemaValidator,
    onSubmit: handleSubmit,
  });
  const { resetForm } = formik;
  const handleAnnotations = async (value) => {
    await updateElmAnnotations(value).catch((err) => {
      console.error("An error occurred while translating CQL to ELM", err);
      setElmTranslationError("Unable to translate CQL to ELM!");
      setElmAnnotations([]);
    });
  };

  const onChange = (value) => {
    formik.setFieldValue("cql", value);
    setElmTranslationError(undefined);
    setSuccessMessage({ status: undefined, message: undefined });
    setValuesetMsg(undefined);
    setValuesetSuccess(false);
  };
  useEffect(() => {
    if (id && _.isNil(loadedCqlLibrary)) {
      cqlLibraryServiceApi
        .fetchCqlLibrary(id)
        .then((cqlLibrary) => {
          resetForm({
            values: { ...cqlLibrary },
          });
          handleAnnotations(cqlLibrary.cql);
          setLoadedCqlLibrary(cqlLibrary);
        })
        .catch(() => {
          setServerError("An error occurred while fetching the CQL Library!");
        });
    }
  }, [id, resetForm, loadedCqlLibrary, cqlLibraryServiceApi]);

  async function createCqlLibrary(cqlLibrary: CqlLibrary) {
    cqlLibraryServiceApi
      .createCqlLibrary(cqlLibrary)
      .then(() => {
        setSuccessMessage({
          status: "success",
          message: "Cql Library successfully created",
        });
      })
      .catch((error) => {
        if (error?.response) {
          let msg: string = error.response.data.message;
          if (!!error.response.data.validationErrors) {
            for (const erroredField in error.response.data.validationErrors) {
              msg = msg.concat(
                ` ${erroredField} : ${error.response.data.validationErrors[erroredField]}`
              );
            }
          }
          setServerError(msg);
        } else {
          setServerError("An error occurred while creating the CQL Library");
        }
      });
  }

  async function updateCqlLibrary(cqlLibrary: CqlLibrary) {
    const inSyncCql = await synchingEditorCqlContent(
      formik.values.cql.trim(),
      loadedCqlLibrary?.cql,
      formik.values.cqlLibraryName,
      loadedCqlLibrary?.cqlLibraryName,
      loadedCqlLibrary?.version,
      "updateCqlLibrary"
    );

    const results = await executeCqlParsingForErrors(inSyncCql);

    if (results[0].status === "rejected") {
      console.error(
        "An error occurred while translating CQL to ELM",
        results[0].reason
      );
      setElmTranslationError("Unable to translate CQL to ELM!");
      setElmAnnotations([]);
    } else if (results[1].status === "rejected") {
      const rejection: PromiseRejectedResult = results[1];
      console.error(
        "An error occurred while parsing the CQL",
        rejection.reason
      );
    }

    const validationResult =
      results[0].status === "fulfilled" ? results[0].value : "";
    const parseErrors =
      results[1].status === "fulfilled" ? results[1].value : true;
    const cqlElmErrors = validationResult
      ? !!(validationResult?.length > 0)
      : true;
    const cqlErrors = inSyncCql?.trim().length
      ? parseErrors || cqlElmErrors
      : false;
    const synchedCqlLibrary = { ...cqlLibrary, cql: inSyncCql, cqlErrors };
    cqlLibraryServiceApi
      .updateCqlLibrary(synchedCqlLibrary)
      .then(() => {
        resetForm({
          values: { ...synchedCqlLibrary },
        });

        const successMessage =
          inSyncCql !== cqlLibrary.cql
            ? {
                status: "warning",
                message:
                  "CQL updated successfully! Library Name and/or Version can not be updated in the CQL Editor. MADiE has overwritten the updated Library Name and/or Version.",
              }
            : { status: "success", message: "CQL saved successfully" };

        setSuccessMessage(successMessage);
      })
      .catch((error) => {
        if (error?.response) {
          let msg: string = error.response.data.message;
          if (!!error.response.data.validationErrors) {
            for (const erroredField in error.response.data.validationErrors) {
              msg = msg.concat(
                ` ${erroredField} : ${error.response.data.validationErrors[erroredField]}`
              );
            }
          }
          setServerError(msg);
        } else {
          setServerError("An error occurred while updating the CQL library");
        }
      });
  }

  async function handleSubmit(cqlLibrary: CqlLibrary) {
    setSuccessMessage({ status: undefined, message: undefined });
    setServerError(undefined);
    if (id) {
      updateCqlLibrary(formik.values);
    } else {
      createCqlLibrary(formik.values);
    }
  }
  const hasParserErrors = async (cql) => {
    return !!(parseContent(cql)?.length > 0);
  };
  const isLoggedInUMLS = (errors: ElmTranslationError[]) => {
    return JSON.stringify(errors).includes("Please log in to UMLS");
  };

  const executeCqlParsingForErrors = async (cql: string) => {
    const results = await Promise.allSettled([
      updateElmAnnotations(cql),
      hasParserErrors(cql),
    ]);
    return results;
  };

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <HelperText
          data-testid={`${name}-helper-text`}
          text={formik.errors[name]}
          isError={isError}
        />
      );
    }
  }

  // Create Dialog utilities
  const [createLibOpen, setCreateLibOpen] = useState<boolean>(false);
  useEffect(() => {
    const openCreateLibraryDialogListener = () => {
      setCreateLibOpen(true);
    };
    window.addEventListener(
      "openCreateLibraryDialog",
      openCreateLibraryDialogListener,
      false
    );
    return () => {
      window.removeEventListener(
        "openCreateLibraryDialog",
        openCreateLibraryDialogListener,
        false
      );
    };
  }, []);

  const updateElmAnnotations = async (
    cql: string
  ): Promise<ElmTranslationError[]> => {
    if (cql && cql.trim().length > 0) {
      const { errors: allErrorsArray } = await validateContent(cql);
      if (isLoggedInUMLS(allErrorsArray)) {
        setValuesetMsg("Please log in to UMLS!");
      }
      const elmAnnotations = mapElmErrorsToAceAnnotations(allErrorsArray);
      setElmAnnotations(elmAnnotations);
      return allErrorsArray;
    } else {
      setElmAnnotations([]);
    }
    return null;
  };
  return (
    <>
      <div tw="flex flex-wrap " style={{ marginBottom: "-5.7rem" }}>
        <CreateNewLibraryDialog
          open={createLibOpen}
          onClose={() => {
            setCreateLibOpen(false);
          }}
        />
        <div tw="flex-wrap max-w-xl">
          <div tw="mx-2 mt-2">
            {!formik.values.draft && (
              <InfoAlert>
                CQL Library is not a draft. Only drafts can be edited.
              </InfoAlert>
            )}
            {serverError && (
              <ErrorAlert
                data-testid="cql-library-server-error-alerts"
                role="alert"
              >
                {serverError}
              </ErrorAlert>
            )}

            {elmTranslationError && (
              <ErrorAlert
                data-testid="cql-library-elm-translation-error-alerts"
                role="alert"
              >
                {elmTranslationError}
              </ErrorAlert>
            )}
            {successMessage.status ? (
              successMessage?.status === "warning" ? (
                <WarningText data-testid="cql-library-warning-alert">
                  {successMessage.message}
                </WarningText>
              ) : (
                <SuccessText
                  data-testid="cql-library-success-alert"
                  role="alert"
                >
                  {successMessage.message}
                </SuccessText>
              )
            ) : (
              ""
            )}
            <form
              data-testid="create-new-cql-library-form"
              onSubmit={formik.handleSubmit}
              tw="m-8"
            >
              <FormRow tw="w-72">
                <TextInput
                  type="text"
                  id="cqlLibraryName"
                  {...formik.getFieldProps("cqlLibraryName")}
                  readOnly={!formik.values.draft}
                  placeholder="Enter a Cql Library Name"
                  data-testid="cql-library-name-text-field"
                >
                  <Label htmlFor="cqlLibraryName" text="Cql Library Name" />
                  {formikErrorHandler("cqlLibraryName", true)}
                </TextInput>
              </FormRow>
              <FormControl tw="w-72">
                <Label text="CQL Library Model" />
                <TextField
                  size="small"
                  select
                  InputLabelProps={{ shrink: false }}
                  InputProps={{
                    readOnly: !formik.values.draft,
                  }}
                  label={formik.values.model === "" ? "Select a model" : " "}
                  id="cqlLibraryModel"
                  data-testid="cql-library-model-select"
                  name={"model"}
                  {...formik.getFieldProps("model")}
                  error={formik.touched.model && Boolean(formik.errors.model)}
                  helperText={formik.touched.model && formik.errors.model}
                >
                  {Object.keys(Model).map((modelKey) => {
                    return (
                      <MenuItem
                        key={modelKey}
                        value={Model[modelKey]}
                        data-testid={`cql-library-model-option-${Model[modelKey]}`}
                      >
                        {Model[modelKey]}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </FormControl>
              <FormRow>
                <Button
                  id="saveBtn"
                  buttonTitle={id ? "Update CQL Library" : "Create Cql Library"}
                  type="submit"
                  tw="mr-3"
                  data-testid="cql-library-save-button"
                  disabled={
                    !(formik.isValid && formik.dirty) ||
                    (!!id &&
                      (_.isNil(loadedCqlLibrary) ||
                        _.isNil(loadedCqlLibrary.id))) ||
                    !formik.values.draft
                  }
                />
                <Button
                  id="cancelBtn"
                  buttonTitle="Cancel"
                  type="button"
                  variant="white"
                  onClick={() => {
                    history.push("/cql-libraries");
                  }}
                  data-testid="cql-library-cancel-button"
                />
              </FormRow>
            </form>
          </div>
        </div>
        <div tw="flex-grow " data-testid="cql-library-editor-component">
          <CqlLibraryEditor
            value={formik.values.cql}
            onChange={onChange}
            readOnly={!formik.values.draft}
            valuesetSuccess={valuesetSuccess}
            valuesetMsg={valuesetMsg}
            inboundAnnotations={elmAnnotations}
          />
        </div>
      </div>
    </>
  );
};

export default CreateEditCqlLibrary;
