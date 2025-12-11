import React, { useEffect, useRef, useState, useCallback } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useFormik } from "formik";
import { CqlLibrary, CqlLibraryLock } from "@madie/madie-models";
import { CqlLibrarySchemaValidator } from "../../validators/CqlLibrarySchemaValidator";
import queryString from "query-string";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import {
  cqlLibraryStore,
  useDocumentTitle,
  useOrganizationApi,
  routeHandlerStore,
  checkUserCanEdit,
  useFeatureFlags,
  useUserServiceApi,
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
  TextArea,
  MadieAlert,
  MadieSpinner,
  AutoComplete,
  MadieDeleteDialog,
  ReadOnlyTextField,
} from "@madie/madie-design-system/dist/react";
import NavTabs from "./NavTabs";
import "./EditCQLLibrary.scss";
import {
  Checkbox,
  IconButton,
  FormControlLabel,
  Typography,
} from "@mui/material";
import StatusHandler from "./statusHandler/StatusHandler";
import Search from "@mui/icons-material/Search";
import useFormikResetOnEvent from "../common/useFormikResetOnEvent";
import CreateVersionDialog from "../createVersionDialog/CreateVersionDialog";
import { AxiosResponse } from "axios";
import CreateDraftDialog from "../createDraftDialog/CreateDraftDialog";
import LibraryShareDialog from "../common/libraryShareDialog/LibraryShareDialog";
import TransferDialog from "../common/transferDialog/TransferDialog";
import {
  TRANSFER_LIBRARY_FAILURE,
  TRANSFER_LIBRARY_SUCCESS,
} from "../cqlLibraryList/CqlLibraryList";
import CqlLibraryHistoryDialog from "../cqlLibraryLanding/CqlLibraryHistoryDialog";
import LibraryLockedPopup from "./libraryLockedPopup/LibraryLockedPopup";

const EditCqlLibrary = () => {
  useDocumentTitle("MADiE Edit Library");
  const navigate = useNavigate();
  const { search } = useLocation();
  const values = queryString.parse(search);
  const activeTab: string = (values.tab && values.tab.toString()) || "details";
  // @ts-ignore
  const { id } = useParams();
  const [loadedCqlLibrary, setLoadedCqlLibrary] = useState<CqlLibrary>(null);
  const [openDeleteDraftDialog, setOpenDeleteDraftDialog] =
    useState<boolean>(false);
  const [openCreateVersionDialog, setOpenCreateVersionDialog] =
    useState<boolean>(false);
  const [openCreateDraftDialog, setOpenCreateDraftDialog] =
    useState<boolean>(false);
  const [shareDialog, setShareDialog] = useState({ open: false, option: "" });
  const [transferDialog, setTransferDialog] = useState({
    open: false,
    libraries: [],
  });
  const [libraryOwner, setLibraryOwner] = useState("-");

  // on unmount forget library state.
  useEffect(() => {
    return () => {
      cqlLibraryStore.updateLibrary(null);
    };
  }, []);

  useEffect(() => {
    const deleteListener = () => {
      setOpenDeleteDraftDialog(true);
    };
    window.addEventListener("delete-library", deleteListener, false);
    return () => {
      window.removeEventListener("delete-library", deleteListener, false);
    };
  }, []);

  useEffect(() => {
    const versionListener = () => {
      setOpenCreateVersionDialog(true);
    };
    window.addEventListener("version-library", versionListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("version-library", versionListener);
    };
  }, []);

  useEffect(() => {
    const draftListener = () => {
      setOpenCreateDraftDialog(true);
    };
    window.addEventListener("draft-library", draftListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("draft-library", draftListener);
    };
  }, []);

  useEffect(() => {
    const shareListener = () => {
      setShareDialog({
        open: true,
        option: "Share With",
      });
    };
    window.addEventListener("share-library", shareListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("share-library", shareListener);
    };
  }, []);

  useEffect(() => {
    const unshareListener = () => {
      setShareDialog({
        open: true,
        option: "Unshare",
      });
    };
    window.addEventListener("unshare-library", unshareListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener("unshare-library", unshareListener);
    };
  }, []);

  useEffect(() => {
    const transferListener = () => {
      setTransferDialog({
        open: true,
        libraries: [loadedCqlLibrary],
      });
    };
    window.addEventListener("transfer-library", transferListener, false);
    return () => {
      window.removeEventListener("transfer-library", transferListener, false);
    };
  }, []);

  useEffect(() => {
    const unshareFromMeListener = () => {
      setShareDialog({
        open: true,
        option: "UnshareFromMe",
      });
    };
    window.addEventListener("unshare-library-from-me", unshareFromMeListener, {
      passive: true,
    });
    return () => {
      window.removeEventListener(
        "unshare-library-from-me",
        unshareFromMeListener
      );
    };
  }, []);

  useEffect(() => {
    if (loadedCqlLibrary?.librarySet?.owner) {
      userServiceApi
        .getOwnerDetails(loadedCqlLibrary?.librarySet?.owner)
        .then((response) => {
          const ownerName = `${response?.firstName} ${response?.lastName}`;
          setLibraryOwner(ownerName);
        })
        .catch(() => {
          setLibraryOwner("-");
        });
    }
  }, [loadedCqlLibrary?.librarySet?.owner]);

  const [libraryHistoryDialogOpen, setLibraryHistoryDialogOpen] =
    useState(false);
  const [libraryHistoryLogs, setLibraryHistoryLogs] = useState([]);

  const openLibraryHistoryDialog = () => {
    cqlLibraryServiceApi.getLibraryHistory(loadedCqlLibrary).then((data) => {
      setLibraryHistoryLogs(data);
      setLibraryHistoryDialogOpen(true);
    });
  };
  const closeLibraryHistoryDialog = () => {
    setLibraryHistoryLogs([]);
    setLibraryHistoryDialogOpen(false);
  };

  useEffect(() => {
    window.addEventListener("history-library", openLibraryHistoryDialog, {
      passive: true,
    });
    return () => {
      window.removeEventListener("history-library", openLibraryHistoryDialog);
    };
  }, [loadedCqlLibrary]);

  // StatusHandler utilities
  const [success, setSuccess] = useState({
    status: undefined,
    primaryMessage: undefined,
    secondaryMessages: undefined,
  });
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(null);
  const [warning, setWarning] = useState({
    status: false,
    primaryMessage: "",
    secondaryMessages: [],
  });
  const [outboundAnnotations, setOutboundAnnotations] = useState([]);

  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const organizationApi = useRef(useOrganizationApi()).current;
  const userServiceApi = useRef(useUserServiceApi()).current;
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
  const featureFlags = useFeatureFlags();
  const canEdit =
    checkUserCanEdit(
      loadedCqlLibrary?.librarySet?.owner,
      loadedCqlLibrary?.librarySet?.acls
    ) && !(featureFlags?.Locking && loadedCqlLibrary?.cqlLibraryLock);
  const libraryLockedBy =
    featureFlags?.Locking && loadedCqlLibrary?.cqlLibraryLock
      ? loadedCqlLibrary?.cqlLibraryLock?.lockedBy
      : undefined;
  const [lockedLibraryPopupOpen, setLockedLibraryPopupOpen] = useState(
    !canEdit
  );

  const onToastClose = () => {
    setToastType("danger");
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

  useFormikResetOnEvent(formik);

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

  const deleteDraftLibrary = async (id: string) => {
    setActiveSpinner(true);
    cqlLibraryServiceApi
      .deleteDraft(id)
      .then(async () => {
        setSuccess({
          status: "success",
          primaryMessage: "The Draft CQL Library has been deleted.",
          secondaryMessages: "",
        });
        setTimeout(() => {
          navigate("/cql-libraries");
        }, 1000);
        handleDialogClose();
      })
      .catch((error) => {
        if (error?.response?.data) {
          const errorData = error?.response?.data;
          const errorMessage = `${errorData?.status}: ${errorData?.error} ${errorData?.message}`;
          setErrorMessage(errorMessage);
        } else {
          setErrorMessage(error.toString());
        }
      });
  };

  const handleDialogClose = () => {
    setOpenCreateVersionDialog(false);
    setOpenDeleteDraftDialog(false);
    setOpenCreateDraftDialog(false);
    setActiveSpinner(false);
    setTransferDialog({ open: false, libraries: [] });
  };

  const createVersionLibrary = async (isMajor: boolean) => {
    setActiveSpinner(true);
    await cqlLibraryServiceApi
      .createVersion(loadedCqlLibrary.id, isMajor)
      .then((response: AxiosResponse<CqlLibrary>) => {
        setSuccess({
          status: "success",
          primaryMessage: "New version of CQL Library is Successfully created.",
          secondaryMessages: "",
        });
        cqlLibraryStore.updateLibrary(response?.data);
        resetForm({
          values: { ...response?.data },
        });
        setLoadedCqlLibrary(response?.data);
      })
      .catch((error) => {
        if (error?.response?.data) {
          const errorData = error?.response?.data;
          const errorMessage =
            errorData?.status === 423
              ? errorData.message
              : `${errorData?.status}: ${errorData?.error} ${errorData?.message}`;
          setErrorMessage(errorMessage);
          handleToast("danger", errorMessage, true);
        } else {
          setErrorMessage(error.toString());
        }
      });
    handleDialogClose();
  };

  const createDraftLibrary = async (cqlLibrary: CqlLibrary, model: string) => {
    setActiveSpinner(true);
    await cqlLibraryServiceApi
      .createDraft(cqlLibrary.id, cqlLibrary.cqlLibraryName, model)
      .then((response: AxiosResponse<CqlLibrary>) => {
        handleDialogClose();
        setSuccess({
          status: "success",
          primaryMessage: "New Draft of CQL Library is Successfully created",
          secondaryMessages: "",
        });
        cqlLibraryStore.updateLibrary(response?.data);
        resetForm({
          values: { ...response?.data },
        });
        setLoadedCqlLibrary(response?.data);
        setTimeout(() => {
          navigate(`/cql-libraries/${response?.data?.id}/edit/details`);
        }, 1000);
      })
      .catch((error) => {
        const errorData = error?.response?.data;
        if (errorData?.status == 400) {
          let message = "Requested Cql Library cannot be drafted.";
          if (error?.response?.data?.message) {
            message = `${message} ${error.response.data.message}`;
          }
          setErrorMessage(message);
        } else if (errorData?.status == 403) {
          setErrorMessage("User is unauthorized to create a draft");
        } else {
          setErrorMessage(errorData?.message);
        }
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
    if (id) {
      if (_.isNil(loadedCqlLibrary)) {
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
            setErrorMessage(
              "An error occurred while fetching the CQL Library!"
            );
          });
      }

      const handleUnload = () => {
        cqlLibraryServiceApi.unlockLibrary(id);
      };
      if (featureFlags?.Locking && canEdit) {
        window.addEventListener("beforeunload", handleUnload);
        cqlLibraryServiceApi
          .lockLibrary(id)
          .then(() => {})
          .catch((e) => {
            console.error("Error locking library:", e);
          });
      }
      return () => {
        if (featureFlags?.Locking && canEdit) {
          window.removeEventListener("beforeunload", handleUnload);
          cqlLibraryServiceApi.unlockLibrary(id);
        }
      };
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
        _.filter(
          validationResult?.errors,
          (e) => _.toLower(e.errorSeverity) === "error"
        )
      ) ||
      !_.isEmpty(
        _.filter(
          validationResult?.externalErrors,
          (e) => _.toLower(e.errorSeverity) === "error"
        )
      );

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
          if (updatedContent.isFhirHelpersAliasChanged) {
            secondaryMessages.push(
              "FHIRHelpers was incorrectly aliased. MADiE has overwritten the alias with 'FHIRHelpers'."
            );
          }
          if (updatedContent.isUsingStatementChanged) {
            secondaryMessages.push(
              "Incorrect using statement(s) detected. MADiE has corrected it."
            );
          }
          if (updatedContent.isValueSetChanged) {
            secondaryMessages.push(
              "MADiE does not currently support use of value set version directly in library at this time. Your value set versions have been removed. Please use the relevant manifest for value set expansion for testing."
            );
          }
          if (updatedContent.isConceptRemoved) {
            secondaryMessages.push(
              "Concept Constructs are not supported in MADiE. It has been removed."
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
          if (featureFlags.Locking && error.response?.status === 423) {
            const splitted = error.response?.data?.message?.trim().split(" ");
            const lockedBy = splitted[splitted.length - 1];
            setLoadedCqlLibrary({
              ...loadedCqlLibrary,
              cqlLibraryLock: { lockedBy } as unknown as CqlLibraryLock,
            });
            resetForm({
              values: { ...loadedCqlLibrary },
            });
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
        setError(
          !_.isEmpty(
            _.filter(errors, (e) => _.toLower(e.errorSeverity) === "error")
          ) ||
            !_.isEmpty(
              _.filter(
                externalErrors,
                (e) => _.toLower(e.errorSeverity) === "error"
              )
            )
        );
      }
      externalErrors && setErrorMessage(externalErrors[0]?.message);
      setElmAnnotations(mapElmErrorsToAceAnnotations(errors));
      return result;
    } else {
      setElmAnnotations([]);
    }
    return null;
  };

  const handleTabChange = (event, nextTab) => {
    navigate(`?tab=${nextTab}`);
  };
  const toggleSearch = () => {
    const event = new CustomEvent("toggleEditorSearchBox");
    window.dispatchEvent(event);
  };

  const handleShareDialogClose = useCallback(
    (type, message) => {
      setShareDialog({
        open: false,
        option: "",
      });

      if (!_.isEmpty(message)) {
        setSuccess({
          status: type,
          primaryMessage: message,
          secondaryMessages: "",
        });
      }
    },
    [shareDialog]
  );

  const transferLibrary = (newOwner: string, retainShareAccess: boolean) => {
    setWarning({
      status: false,
      primaryMessage: "",
      secondaryMessages: [],
    });

    const libraryIds = loadedCqlLibrary.id;
    return cqlLibraryServiceApi
      .transferLibraries([libraryIds], newOwner, retainShareAccess)
      .then((response) => {
        if (response.status === 200) {
          setToastOpen(true);
          setToastType("success");
          setToastMessage(TRANSFER_LIBRARY_SUCCESS);

          setTimeout(() => {
            navigate("/cql-libraries");
          }, 1000);
        } else if (response.status === 207) {
          setWarning({
            status: true,
            primaryMessage: `1 Libraries could not be transferred. Please try again, or contact help desk if the issue persists.`,
            secondaryMessages: [loadedCqlLibrary.cqlLibraryName],
          });
        }
      })
      .catch((error) => {
        console.error("TransferDialog: handleSave: error = ", error);
        setToastOpen(true);
        setToastType("danger");
        setToastMessage(TRANSFER_LIBRARY_FAILURE);
      })
      .finally(() => {
        handleDialogClose();
      });
  };

  return (
    <div>
      {activeSpinner ? (
        <div data-testid="loading">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MadieSpinner style={{ height: 50, width: 50 }} />
          </div>
        </div>
      ) : (
        <form
          id="edit-library-page"
          data-testId="edit-library-form"
          onSubmit={formik.handleSubmit}
        >
          <StatusHandler
            error={error}
            errorMessage={errorMessage}
            success={success}
            warning={warning}
            outboundAnnotations={outboundAnnotations}
          />
          <div
            className="allotment-wrapper"
            data-testid="cql-library-editor-component"
          >
            <Allotment>
              <Allotment.Pane>
                <div className="left-panel" tw="flex-grow">
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
                  <CqlLibraryEditor
                    value={formik.values.cql}
                    onChange={onChange}
                    readOnly={!formik.values.draft || !canEdit}
                    valuesetSuccess={valuesetSuccess}
                    valuesetMsg={valuesetMsg}
                    inboundAnnotations={elmAnnotations}
                    setOutboundAnnotations={setOutboundAnnotations}
                  />
                </div>
              </Allotment.Pane>
              <Allotment.Pane>
                <div className="right-panel">
                  <NavTabs
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                  />
                  <div
                    style={{ height: "calc(100% - 48px)", overflowY: "auto" }}
                  >
                    <div
                      style={{
                        paddingTop: 10,
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
                                    CQL Library is not a draft. Only drafts can
                                    be edited.
                                  </p>
                                }
                                canClose={false}
                                minimizeAlerts={false}
                              />
                            </div>
                          )}
                          {!checkUserCanEdit(
                            loadedCqlLibrary?.librarySet?.owner,
                            loadedCqlLibrary?.librarySet?.acls
                          ) && (
                            <div className="form-row">
                              <MadieAlert
                                type="info"
                                content={
                                  <p>
                                    You are not the owner of the CQL Library.
                                    Only owner can edit it.
                                  </p>
                                }
                                canClose={false}
                                minimizeAlerts={false}
                              />
                            </div>
                          )}

                          <div className="form-row">
                            <TextField
                              label="CQL Library Name"
                              required
                              id="cqlLibraryName"
                              data-testid="cql-library-name-text-field"
                              readOnly={!formik.values.draft || !canEdit}
                              inputProps={{
                                id: "cql-library-name-text-field-input",
                                "data-testid":
                                  "cql-library-name-text-field-input",
                                "aria-required": true,
                                required: true,
                              }}
                              error={
                                formik.touched.cqlLibraryName &&
                                Boolean(formik.errors.cqlLibraryName)
                              }
                              {...formik.getFieldProps("cqlLibraryName")}
                              helperText={formikErrorHandler(
                                "cqlLibraryName",
                                true
                              )}
                              placeholder="Enter a Cql Library Name"
                              maxLength={64}
                            />
                          </div>

                          <div className="form-row">
                            <TextArea
                              label="Description"
                              readOnly={!formik.values.draft || !canEdit}
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
                              helperText={formikErrorHandler(
                                "description",
                                true
                              )}
                            />
                          </div>

                          <div className="form-row">
                            <AutoComplete
                              id="publisher"
                              dataTestId="publisher"
                              label="Publisher"
                              placeholder="-"
                              required={true}
                              readOnly={!formik.values.draft || !canEdit}
                              error={
                                formik.touched.publisher &&
                                formik.errors.publisher
                              }
                              helperText={
                                formik.touched.publisher &&
                                formik.errors.publisher
                              }
                              options={organizations}
                              {...formik.getFieldProps("publisher")}
                              onChange={formik.setFieldValue}
                            />
                          </div>

                          {featureFlags?.DisplayOwner && (
                            <div className="form-row">
                              <ReadOnlyTextField
                                value={libraryOwner}
                                label={"Library Owner"}
                                tabIndex={0}
                                placeholder="Library Owner"
                                id="library-owner-label"
                                data-testid="library-owner-text-field"
                                inputProps={{
                                  "data-testid": "library-owner-input",
                                }}
                                size="small"
                              />
                            </div>
                          )}

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
                                  sx={{
                                    "& .MuiSvgIcon-root": { fontSize: 28 },
                                  }}
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
              </Allotment.Pane>
            </Allotment>
            {/* </div> */}
          </div>
          <div id="sticky-footer">
            <Button
              variant="outline"
              tw="mx-2"
              disabled={!formik.dirty || !canEdit}
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
                  (_.isNil(loadedCqlLibrary) ||
                    _.isNil(loadedCqlLibrary.id))) ||
                !formik.values.draft ||
                !canEdit
              }
            >
              Save
            </Button>
          </div>
          <Toast
            toastKey="library-cql-editor-toast"
            aria-live="polite"
            role="alert"
            toastType={toastType}
            testId={
              toastType === "danger"
                ? "edit-library-cql-generic-error-text"
                : "edit-library-cql-success-text"
            }
            closeButtonProps={{
              "data-testid": "close-toast-button",
            }}
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
              navigate("/cql-libraries");
            }}
          />
          <MadieDeleteDialog
            open={openDeleteDraftDialog}
            dialogTitle={`Delete draft of ${loadedCqlLibrary?.cqlLibraryName}?`}
            name={`draft of ${loadedCqlLibrary?.cqlLibraryName}`}
            onClose={handleDialogClose}
            onContinue={() => deleteDraftLibrary(loadedCqlLibrary?.id)}
          />
          <LibraryShareDialog
            libraries={[loadedCqlLibrary]}
            open={shareDialog.open}
            option={shareDialog.option}
            onClose={handleShareDialogClose}
          />
          <CreateVersionDialog
            open={openCreateVersionDialog}
            onClose={handleDialogClose}
            onSubmit={createVersionLibrary}
            cqlLibraryError={null}
            isCqlPresent={
              loadedCqlLibrary && loadedCqlLibrary.cql?.trim().length > 0
            }
          />
          <CreateDraftDialog
            open={openCreateDraftDialog}
            onClose={handleDialogClose}
            onSubmit={createDraftLibrary}
            cqlLibrary={loadedCqlLibrary}
          />
          <TransferDialog
            libraries={[loadedCqlLibrary]}
            open={transferDialog.open}
            onClose={handleDialogClose}
            onSubmit={transferLibrary}
          />
        </form>
      )}
      {libraryHistoryDialogOpen && (
        <CqlLibraryHistoryDialog
          selectedCqlLibrary={loadedCqlLibrary}
          libraryHistoryLogs={libraryHistoryLogs}
          open={libraryHistoryDialogOpen}
          onClose={closeLibraryHistoryDialog}
        />
      )}
      {checkUserCanEdit(
        loadedCqlLibrary?.librarySet?.owner,
        loadedCqlLibrary?.librarySet?.acls
      ) &&
        libraryLockedBy && (
          <LibraryLockedPopup
            libraryLockedBy={libraryLockedBy}
            lockedLibraryPopupOpen={lockedLibraryPopupOpen}
            setLockedLibraryPopupOpen={setLockedLibraryPopupOpen}
          />
        )}
    </div>
  );
};

export default EditCqlLibrary;
