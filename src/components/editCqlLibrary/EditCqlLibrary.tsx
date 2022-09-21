import React, { useEffect, useRef, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import { CqlLibrary, Model } from "@madie/madie-models";
import { CqlLibrarySchemaValidator } from "../../validators/CqlLibrarySchemaValidator";
import queryString from "query-string";
import { HelperText, Label, TextInput } from "@madie/madie-components";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import { cqlLibraryStore } from "@madie/madie-util";
// import TextField from "@mui/material/TextField";
import * as _ from "lodash";
import CqlLibraryEditor, {
  mapElmErrorsToAceAnnotations,
} from "../cqlLibraryEditor/CqlLibraryEditor";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";
import {
  EditorAnnotation,
  ElmTranslationError,
  parseContent,
  synchingEditorCqlContent,
  validateContent,
  ValidationResult,
} from "@madie/madie-editor";
import {
  Toast,
  Button,
  TextField,
} from "@madie/madie-design-system/dist/react";
import NavTabs from "./NavTabs";
import "./EditCQLLibrary.scss";

const SuccessText = tw.div`bg-green-200 rounded-lg py-3 px-3 text-green-900 mb-3`;
const WarningText = tw.div`bg-yellow-200 rounded-lg py-3 px-3 text-yellow-800 mb-3`;
const ErrorAlert = tw.div`bg-red-200 rounded-lg py-3 px-3 text-red-900 mb-3`;
const InfoAlert = tw.div`bg-blue-200 rounded-lg py-1 px-1 text-blue-900 mb-3`;

const EditCqlLibrary = () => {
  const history = useHistory();
  const { search } = useLocation();
  const values = queryString.parse(search);
  const activeTab: string = (values.tab && values.tab.toString()) || "details";
  // @ts-ignore
  const { id } = useParams();
  const [loadedCqlLibrary, setLoadedCqlLibrary] = useState<CqlLibrary>(null);
  // on unmount forget library state.
  useEffect(() => {
    return () => {
      cqlLibraryStore.updateLibrary(null);
    };
  }, []);

  const [serverError, setServerError] = useState(undefined);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [elmTranslationError, setElmTranslationError] = useState(undefined);
  const [successMessage, setSuccessMessage] = useState({
    status: undefined,
    message: undefined,
  });
  const [valuesetMsg, setValuesetMsg] = useState(null);
  const [valuesetSuccess, setValuesetSuccess] = useState<boolean>(true);
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);

  // toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType(null);
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  const formik = useFormik({
    initialValues: {
      cqlLibraryName: loadedCqlLibrary?.cqlLibraryName,
      model: loadedCqlLibrary?.model,
      cql: loadedCqlLibrary?.cql,
      draft: loadedCqlLibrary?.draft,
      id,
    } as CqlLibrary,
    validationSchema: CqlLibrarySchemaValidator,
    onSubmit: handleSubmit,
    enableReinitialize: true,
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
          cqlLibraryStore.updateLibrary(cqlLibrary);
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

    const parseErrors =
      results[1].status === "fulfilled" ? results[1].value : true;

    const validationResult =
      results[0].status === "fulfilled" ? results[0].value : null;

    const cqlElmErrors =
      !_.isEmpty(validationResult?.errors) ||
      !_.isEmpty(validationResult?.externalErrors);
    const cqlErrors = inSyncCql?.trim().length
      ? parseErrors || cqlElmErrors
      : false;
    const synchedCqlLibrary = { ...cqlLibrary, cql: inSyncCql, cqlErrors };
    cqlLibraryServiceApi
      .updateCqlLibrary(synchedCqlLibrary)
      .then(() => {
        const updatedLibrary = Object.assign(
          {},
          loadedCqlLibrary,
          synchedCqlLibrary
        );
        setLoadedCqlLibrary(updatedLibrary);
        resetForm();

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
    return await Promise.allSettled([
      updateElmAnnotations(cql),
      hasParserErrors(cql),
    ]);
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
  ): Promise<ValidationResult> => {
    if (cql && cql.trim().length > 0) {
      const result = await validateContent(cql);
      const { errors, externalErrors } = result;
      // right now we are only displaying the external errors related to included libraries
      // and only the first error returned by elm translator
      handleToast("danger", externalErrors[0]?.message, true);
      if (isLoggedInUMLS(errors)) {
        setValuesetMsg("Please log in to UMLS!");
      }
      setElmAnnotations(mapElmErrorsToAceAnnotations(errors));
      return result;
    } else {
      setElmAnnotations([]);
    }
    return null;
  };
  const handleTabChange = (event, nextTab) => {
    history.push(`?tab=${nextTab}`);
  };

  return (
    <form
      id="edit-measure-page"
      data-testId="create-new-cql-library-form"
      onSubmit={formik.handleSubmit}
    >
      {/* main page container */}
      <div className="flow-container">
        <div id="left-panel">
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
        <div id="divider" />
        <div id="right-panel">
          <NavTabs activeTab={activeTab} handleTabChange={handleTabChange} />
          <div className="inner-right">
            {activeTab === "details" && (
              <div id="details-tab" data-test-id="details-tab">
                {/* formik tab */}
                {!formik.values.draft && (
                  <div className="form-row">
                    <InfoAlert>
                      CQL Library is not a draft. Only drafts can be edited.
                    </InfoAlert>
                  </div>
                )}
                {serverError && (
                  <div className="form-row">
                    <ErrorAlert
                      data-testid="cql-library-server-error-alerts"
                      role="alert"
                    >
                      {serverError}
                    </ErrorAlert>
                  </div>
                )}

                {elmTranslationError && (
                  <div className="form-row">
                    <ErrorAlert
                      data-testid="cql-library-elm-translation-error-alerts"
                      role="alert"
                    >
                      {elmTranslationError}
                    </ErrorAlert>
                  </div>
                )}
                {successMessage.status ? (
                  successMessage?.status === "warning" ? (
                    <div className="form-row">
                      <WarningText data-testid="cql-library-warning-alert">
                        {successMessage.message}
                      </WarningText>
                    </div>
                  ) : (
                    <div className="form-row">
                      <SuccessText
                        data-testid="cql-library-success-alert"
                        role="alert"
                      >
                        {successMessage.message}
                      </SuccessText>
                    </div>
                  )
                ) : (
                  ""
                )}
                {/* <form data-testId="create-new-cql-library-form" id="cql-library-form"> */}
                <div className="form-row">
                  {/* should it be read only? */}
                  <TextField
                    label="CQL Library Name"
                    required
                    id="cqlLibraryName"
                    data-testid="cql-library-name-text-field"
                    inputProps={{
                      id: "cql-library-name-text-field-input",
                      "data-testid": "cql-library-name-text-field-input",
                      readOnly: !formik.values.draft,
                    }}
                    error={
                      formik.touched.cqlLibraryName &&
                      Boolean(formik.errors.cqlLibraryName)
                    }
                    {...formik.getFieldProps("cqlLibraryName")}
                    helperText={formikErrorHandler("cqlLibraryName", true)}
                    placeholder="Enter a Cql Library Name"
                  />
                </div>
                {/* </form> */}
              </div>
            )}
          </div>
        </div>
        {/* footer lives here */}
      </div>
      <div id="sticky-footer">
        <button
          className="blue-60-outline"
          disabled={!formik.dirty}
          data-testid="cql-library-cancel-button"
          onClick={() => {
            history.push("/cql-libraries");
          }}
        >
          Discard Changes
        </button>
        <Button
          data-testid="cql-library-save-button"
          role="button"
          variant="cyan"
          type="submit"
          disabled={
            !(formik.isValid && formik.dirty) ||
            (!!id &&
              (_.isNil(loadedCqlLibrary) || _.isNil(loadedCqlLibrary.id))) ||
            !formik.values.draft
          }
        >
          Save
        </Button>
      </div>
      <Toast
        toastKey="library-cql-editor-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "edit-library-cql-generic-error-text"
            : "edit-library-cql-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
      <CreateNewLibraryDialog
        open={createLibOpen}
        onClose={() => {
          setCreateLibOpen(false);
        }}
      />
    </form>
  );
};

export default EditCqlLibrary;
