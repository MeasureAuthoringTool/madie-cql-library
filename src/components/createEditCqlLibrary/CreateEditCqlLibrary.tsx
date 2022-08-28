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
import CqlLibraryEditor from "../cqlLibraryEditor/CqlLibraryEditor";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";
import { synchingEditorCqlContent } from "@madie/madie-editor";

const SuccessText = tw.div`bg-green-200 rounded-lg py-3 px-3 text-green-900 mb-3`;
const ErrorAlert = tw.div`bg-red-200 rounded-lg py-3 px-3 text-red-900 mb-3`;
const InfoAlert = tw.div`bg-blue-200 rounded-lg py-1 px-1 text-blue-900 mb-3`;
const FormRow = tw.div`mt-3`;

const CreateEditCqlLibrary = () => {
  const history = useHistory();
  // @ts-ignore
  const { id } = useParams();
  const [serverError, setServerError] = useState(undefined);
  const [loadedCqlLibrary, setLoadedCqlLibrary] = useState<CqlLibrary>(null);
  const [displayAnnotations, setDisplayAnnotations] = useState<boolean>(false);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [elmTranslationError, setElmTranslationError] = useState(undefined);
  const [successMessage, setSuccessMessage] = useState(undefined);
  const [library, setLibrary] = useState<CqlLibrary>(null);
  const [handleClick, setHandleClick] = useState<boolean>(undefined);
  const [executeCqlParsing, setExecuteCqlParsing] =
    useState<boolean>(undefined);
  const [errorResults, setErrorResults] = useState<object>(undefined);

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

  useEffect(() => {
    if (id && _.isNil(loadedCqlLibrary)) {
      cqlLibraryServiceApi
        .fetchCqlLibrary(id)
        .then((cqlLibrary) => {
          resetForm({
            values: { ...cqlLibrary },
          });
          setDisplayAnnotations(true);
          setLoadedCqlLibrary(cqlLibrary);
        })
        .catch(() => {
          setServerError("An error occurred while fetching the CQL Library!");
        });
    }
  }, [id, resetForm, loadedCqlLibrary, cqlLibraryServiceApi]);

  useEffect(() => {
    if (handleClick && errorResults) {
      if (id) {
        updateCqlLibrary(library, errorResults);
      } else {
        createCqlLibrary(library, errorResults);
      }
    }
  }, [errorResults]);

  async function createCqlLibrary(cqlLibrary: CqlLibrary, errorResults) {
    const parseErrors = errorResults[1].value;
    const cqlElmErrors = !!(errorResults[0].value?.errorExceptions?.length > 0);
    const cqlErrors = parseErrors || cqlElmErrors;
    cqlLibrary = { ...cqlLibrary, cql: formik.values.cql.trim(), cqlErrors };

    cqlLibraryServiceApi
      .createCqlLibrary(cqlLibrary)
      .then(() => {
        setHandleClick(undefined);
        setSuccessMessage("Cql Library successfully created");
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

  async function updateCqlLibrary(cqlLibrary: CqlLibrary, errorResults) {
    const inSyncCql = await synchingEditorCqlContent(
      formik.values.cql.trim(),
      loadedCqlLibrary?.cql,
      formik.values.cqlLibraryName,
      loadedCqlLibrary?.cqlLibraryName,
      loadedCqlLibrary?.version,
      "updateCqlLibrary"
    );
    const parseErrors = errorResults[1].value;
    const cqlElmErrors = !!(errorResults[0].value?.errorExceptions?.length > 0);
    const cqlErrors = parseErrors || cqlElmErrors;
    cqlLibrary = { ...cqlLibrary, cql: inSyncCql, cqlErrors };

    cqlLibraryServiceApi
      .updateCqlLibrary(cqlLibrary)
      .then(() => {
        resetForm({
          values: { ...cqlLibrary },
        });
        setHandleClick(undefined);
        setSuccessMessage("Cql Library successfully updated");
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
    setLibrary(cqlLibrary);
    setSuccessMessage(undefined);
    setHandleClick(true);
    setServerError(undefined);
    setDisplayAnnotations(true);
    setExecuteCqlParsing(true);
  }

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
            {elmTranslationError && displayAnnotations && (
              <ErrorAlert
                data-testid="cql-library-elm-translation-error-alerts"
                role="alert"
              >
                {elmTranslationError}
              </ErrorAlert>
            )}
            {successMessage && (
              <SuccessText data-testid="cql-library-success-alert" role="alert">
                {successMessage}
              </SuccessText>
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
            displayAnnotations={displayAnnotations}
            setDisplayAnnotations={setDisplayAnnotations}
            setElmTranslationError={setElmTranslationError}
            setSuccessMessage={setSuccessMessage}
            setErrorResults={setErrorResults}
            value={formik.values.cql}
            onChange={(val: string) => formik.setFieldValue("cql", val)}
            readOnly={!formik.values.draft}
            executeCqlParsing={executeCqlParsing}
            setExecuteCqlParsing={setExecuteCqlParsing}
          />
        </div>
      </div>
    </>
  );
};

export default CreateEditCqlLibrary;
