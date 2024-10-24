import React, { useEffect, useRef, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { useFormik } from "formik";
import { CqlLibrary, Model } from "@madie/madie-models";
import { CqlLibrarySchemaValidator } from "../../validators/CqlLibrarySchemaValidator";
import queryString from "query-string";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import {
  cqlLibraryStore,
  useDocumentTitle,
  useOrganizationApi,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import * as _ from "lodash";
import CqlLibraryEditor, {
  mapElmErrorsToAceAnnotations,
} from "../cqlLibraryEditor/CqlLibraryEditor";
import {
  EditorAnnotation,
  isUsingEmpty,
  parseContent,
  synchingEditorCqlContent,
  validateContent,
  ValidationResult,
} from "@madie/madie-editor";
import {
  Toast,
  Button,
  MadieDiscardDialog,
  TextField,
  MadieAlert,
  MadieSpinner,
  AutoComplete,
} from "@madie/madie-design-system/dist/react";
import NavTabs from "./NavTabs";
import "./EditCQLLibrary.scss";
import {
  Checkbox,
  IconButton,
  FormControlLabel,
  Typography,
} from "@mui/material";
import TextArea from "../common/TextArea";
import StatusHandler from "./statusHandler/StatusHandler";
import Search from "@mui/icons-material/Search";

const EditCqlLibrary = () => {
  useDocumentTitle("MADiE Edit Library");
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

  // StatusHandler utilities
  const [success, setSuccess] = useState({
    status: undefined,
    primaryMessage: undefined,
    secondaryMessages: undefined,
  });
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);
  const [outboundAnnotations, setOutboundAnnotations] = useState([]);

  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const organizationApi = useRef(useOrganizationApi()).current;
  const [valuesetMsg, setValuesetMsg] = useState(null);
  const [valuesetSuccess, setValuesetSuccess] = useState<boolean>(true);
  const [elmAnnotations, setElmAnnotations] = useState<EditorAnnotation[]>([]);
  const [organizations, setOrganizations] = useState<string[]>();
  const [activeSpinner, setActiveSpinner] = useState<boolean>(false);

  // toast utilities
  // toast is used only for displaying error message from fetching orgs list
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [discardDialogOpen, setDiscardDialogOpen] = useState<boolean>(false);
  const { updateRouteHandlerState } = routeHandlerStore;
  const canEdit = checkUserCanEdit(
    loadedCqlLibrary?.librarySet?.owner,
    loadedCqlLibrary?.librarySet?.acls
  );

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
      description: loadedCqlLibrary?.description,
      publisher: loadedCqlLibrary?.publisher || "",
      experimental: loadedCqlLibrary?.experimental || false,
      model: loadedCqlLibrary?.model,
      cql: loadedCqlLibrary?.cql,
      draft: loadedCqlLibrary?.draft,
      librarySetId: loadedCqlLibrary?.librarySetId,
      librarySet: loadedCqlLibrary?.librarySet,
      id,
    } as CqlLibrary,
    validationSchema: CqlLibrarySchemaValidator,
    onSubmit: async (cqlLibrary: CqlLibrary) => {
      await updateCqlLibrary(cqlLibrary);
    },
    enableReinitialize: true,
  });
  const { resetForm } = formik;

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty, updateRouteHandlerState]);

  const handleAnnotations = async (value) => {
    await updateElmAnnotations(value).catch((err) => {
      console.error("An error occurred while translating CQL to ELM", err);
      setError(true);
      setErrorMessage("Unable to translate CQL to ELM!");
      setElmAnnotations([]);
    });
  };

  const onChange = (value) => {
    formik.setFieldValue("cql", value);
    setSuccess({
      status: undefined,
      primaryMessage: undefined,
      secondaryMessages: undefined,
    });
    setError(false);
    setErrorMessage(undefined);
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
          setError(true);
          setErrorMessage("An error occurred while fetching the CQL Library!");
        });
    }
  }, [id, resetForm, loadedCqlLibrary, cqlLibraryServiceApi]);

  // fetch organizations DB using measure service and sorts alphabetically
  useEffect(() => {
    organizationApi
      .getAllOrganizations()
      .then((response) => {
        const organizationsList = response
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((element) => element.name);
        setOrganizations(organizationsList);
      })
      .catch(() => {
        const message = `Error fetching organizations`;
        handleToast("danger", message, true);
      });
  }, []);

  async function updateCqlLibrary(cqlLibrary: CqlLibrary) {
    setActiveSpinner(true);
    const using = loadedCqlLibrary?.model.split(" v");
    const updatedContent = await synchingEditorCqlContent(
      formik.values.cql?.trim() ?? "",
      loadedCqlLibrary?.cql,
      formik.values.cqlLibraryName,
      loadedCqlLibrary?.cqlLibraryName,
      loadedCqlLibrary?.version,
      using[0],
      using[1],
      "updateCqlLibrary"
    );
    const results = await executeCqlParsingForErrors(updatedContent.cql);
    if (results[0].status === "rejected") {
      console.error(
        "An error occurred while translating CQL to ELM",
        results[0].reason
      );
      setError(true);
      setErrorMessage("Unable to translate CQL to ELM!");
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

    // cqlErrors flag is turned ON either the CQL has external Errors or at least 1 error whose errorSeverity is "Error"
    // Warnings are ignored and doesn't affect cqlErrors flag
    const cqlElmErrors =
      !_.isEmpty(
        _.filter(validationResult?.errors, { errorSeverity: "Error" })
      ) || !_.isEmpty(validationResult?.externalErrors);

    const cqlErrors = updatedContent.cql?.trim().length
      ? parseErrors || cqlElmErrors
      : false;
    const updatedLibrary = {
      ...cqlLibrary,
      cql: updatedContent.cql,
      cqlErrors,
    };
    cqlLibraryServiceApi
      .updateCqlLibrary(updatedLibrary)
      .then((response) => {
        cqlLibraryStore.updateLibrary(response.data);
        setLoadedCqlLibrary(response.data);
        resetForm();
        let primaryMessage = "CQL updated successfully";
        const secondaryMessages = [];
        if (updatedContent.cql?.trim()) {
          if (isUsingEmpty(updatedContent.cql)) {
            secondaryMessages.push(
              "Missing a using statement. Please add in a valid model and version."
            );
          }
          if (updatedContent.isLibraryStatementChanged) {
            secondaryMessages.push(
              "Library statement was incorrect. MADiE has overwritten it."
            );
          }
          if (updatedContent.isUsingStatementChanged) {
            secondaryMessages.push(
              "Using statement was incorrect. MADiE has overwritten it."
            );
          }
          if (updatedContent.isValueSetChanged) {
            secondaryMessages.push(
              "MADiE does not currently support use of value set version directly in library at this time. Your value set versions have been removed. Please use the relevant manifest for value set expansion for testing."
            );
          }
          if (secondaryMessages.length > 0) {
            primaryMessage += " but the following issues were found";
          }
        }
        setSuccess({
          status: "success",
          primaryMessage,
          secondaryMessages,
        });
      })
      .catch((error) => {
        setError(true);
        if (error?.response) {
          let msg: string = error.response.data.message;
          if (!!error.response.data.validationErrors) {
            for (const erroredField in error.response.data.validationErrors) {
              msg = msg.concat(
                ` ${erroredField} : ${error.response.data.validationErrors[erroredField]}`
              );
            }
          }
          setErrorMessage(msg);
        } else {
          setErrorMessage("An error occurred while updating the CQL library");
        }
      });
    setActiveSpinner(false);
  }

  const hasParserErrors = async (cql) => {
    return !!(parseContent(cql)?.length > 0);
  };

  const executeCqlParsingForErrors = async (cql: string) => {
    return await Promise.allSettled([
      updateElmAnnotations(cql),
      hasParserErrors(cql),
    ]);
  };

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }

  const updateElmAnnotations = async (
    cql: string
  ): Promise<ValidationResult> => {
    setError(false);
    if (cql && cql.trim().length > 0) {
      const result = await validateContent(cql);
      const { errors, externalErrors } = result;
      // right now we are only displaying the external errors related to included libraries
      // and only the first error returned by elm translator
      if (errors?.length > 0 || externalErrors?.length > 0) {
        const elmErrors = _.filter(errors, { errorSeverity: "Error" });
        setError(!_.isEmpty(elmErrors) || externalErrors.length > 0);
      }
      setErrorMessage(externalErrors[0]?.message);
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
  const toggleSearch = () => {
    const event = new CustomEvent("toggleEditorSearchBox");
    window.dispatchEvent(event);
  };
  return (
    <form
      id="edit-library-page"
      data-testId="edit-library-form"
      onSubmit={formik.handleSubmit}
    >
      <StatusHandler
        error={error}
        errorMessage={errorMessage}
        success={success}
        outboundAnnotations={outboundAnnotations}
      />
      <div className="flow-container">
        <div id="left-panel">
          <div tw="flex-grow " data-testid="cql-library-editor-component">
            {!activeSpinner && (
              <>
                <div id="header-editor-row">
                  <IconButton
                    data-testid="editor-search-button"
                    aria-label="search button"
                    style={{
                      color: "#0073c8",
                    }}
                    onClick={toggleSearch}
                  >
                    <Search />
                  </IconButton>
                </div>
                <CqlLibraryEditor
                  value={formik.values.cql}
                  onChange={onChange}
                  readOnly={!formik.values.draft || !canEdit}
                  valuesetSuccess={valuesetSuccess}
                  valuesetMsg={valuesetMsg}
                  inboundAnnotations={elmAnnotations}
                  setOutboundAnnotations={setOutboundAnnotations}
                />
              </>
            )}
            {activeSpinner && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  height: "calc(100vh - 135px)",
                }}
              >
                <MadieSpinner style={{ height: 50, width: 50 }} />
              </div>
            )}
          </div>
        </div>
        <div id="divider" />
        <div id="right-panel">
          <NavTabs activeTab={activeTab} handleTabChange={handleTabChange} />
          <div
            style={{
              marginBottom: -10,
              marginTop: 10,
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Typography
              style={{
                fontSize: 14,
                fontWeight: 300,
                fontFamily: "Rubik",
                marginRight: 32,
              }}
            >
              <span
                style={{
                  color: "rgb(174, 28, 28)",
                  marginRight: 3,
                  fontWeight: 400,
                }}
              >
                *
              </span>
              Indicates required field
            </Typography>
          </div>
          <div className="inner-right">
            {activeTab === "details" && (
              <div id="details-tab" data-test-id="details-tab">
                {/* These are loaded in first instance and then removed why ? */}
                {!formik.values.draft && (
                  <div className="form-row">
                    <MadieAlert
                      type="info"
                      content={
                        <p>
                          CQL Library is not a draft. Only drafts can be edited.
                        </p>
                      }
                      canClose={false}
                    />
                  </div>
                )}
                {!canEdit && (
                  <div className="form-row">
                    <MadieAlert
                      type="info"
                      content={
                        <p>
                          You are not the owner of the CQL Library. Only owner
                          can edit it.
                        </p>
                      }
                      canClose={false}
                    />
                  </div>
                )}

                <div className="form-row">
                  <TextField
                    label="CQL Library Name"
                    required
                    id="cqlLibraryName"
                    data-testid="cql-library-name-text-field"
                    disabled={!formik.values.draft || !canEdit}
                    inputProps={{
                      id: "cql-library-name-text-field-input",
                      "data-testid": "cql-library-name-text-field-input",
                      "aria-required": true,
                      required: true,
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

                <div className="form-row">
                  <TextArea
                    label="Description"
                    disabled={!formik.values.draft || !canEdit}
                    required
                    name="cql-library-description"
                    id="cql-library-description"
                    onChange={formik.handleChange}
                    value={formik.values.description}
                    placeholder="Description"
                    data-testid={"cql-library-description"}
                    {...formik.getFieldProps("description")}
                    error={
                      formik.touched.description &&
                      Boolean(formik.errors.description)
                    }
                    helperText={formikErrorHandler("description", true)}
                  />
                </div>

                <div className="form-row">
                  <AutoComplete
                    id="publisher"
                    dataTestId="publisher"
                    label="Publisher"
                    placeholder="-"
                    required={true}
                    disabled={!formik.values.draft || !canEdit}
                    error={formik.touched.publisher && formik.errors.publisher}
                    helperText={
                      formik.touched.publisher && formik.errors.publisher
                    }
                    options={organizations}
                    {...formik.getFieldProps("publisher")}
                    onChange={formik.setFieldValue}
                  />
                </div>

                <div className="form-row">
                  <FormControlLabel
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: 16,
                        fontWeight: 300,
                      },
                    }}
                    control={
                      <Checkbox
                        id="experimental"
                        data-testid="cql-library-experimental-checkbox"
                        sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                        disabled={!formik.values.draft || !canEdit}
                        {...formik.getFieldProps("experimental")}
                        checked={formik.values.experimental}
                        onChange={(event: any) => {
                          formik.setFieldValue(
                            "experimental",
                            event.target.checked
                          );
                        }}
                      />
                    }
                    label="Experimental"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div id="sticky-footer">
        <Button
          variant="outline"
          tw="mx-2"
          disabled={!formik.dirty}
          data-testid="cql-library-cancel-button"
          onClick={(e) => {
            e.preventDefault();
            setDiscardDialogOpen(true);
          }}
        >
          Discard Changes
        </Button>
        <Button
          tw="!mt-0 mx-2"
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
      <MadieDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onContinue={async () => {
          await resetForm();
          history.push("/cql-libraries");
        }}
      />
    </form>
  );
};

export default EditCqlLibrary;
