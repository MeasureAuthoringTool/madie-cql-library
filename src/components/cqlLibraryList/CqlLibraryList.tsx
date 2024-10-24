import React, { useRef, useState } from "react";
import Popover from "@mui/material/Popover";
import "twin.macro";
import "styled-components/macro";
import { useHistory } from "react-router-dom";
import { CqlLibrary } from "@madie/madie-models";
import CreatVersionDialog from "../createVersionDialog/CreateVersionDialog";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CreatDraftDialog from "../createDraftDialog/CreateDraftDialog";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { checkUserCanDelete, checkUserCanEdit } from "@madie/madie-util";
import {
  Button,
  MadieDeleteDialog,
} from "@madie/madie-design-system/dist/react";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const INITIAL_DELETE_DRAFT_STATE = {
  open: false,
  cqlLibrary: null,
};

export default function CqlLibraryList({ cqlLibraryList, onListUpdate }) {
  const history = useHistory();
  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    cqlLibraryId: "",
    cqlLibraryError: null,
    isCqlPresent: undefined,
  });
  const [createDraftDialog, setCreateDraftDialog] = useState({
    open: false,
    cqlLibrary: null,
  });
  const [deleteDraftDialog, setDeleteDraftDialog] = useState({
    ...INITIAL_DELETE_DRAFT_STATE,
  });
  const [snackBar, setSnackBar] = useState({
    message: "",
    open: false,
    severity: null,
  });
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  const handleDialogClose = () => {
    setCreateVersionDialog({
      open: false,
      cqlLibraryId: "",
      cqlLibraryError: "",
      isCqlPresent: true,
    });
    setCreateDraftDialog({ open: false, cqlLibrary: null });
    setDeleteDraftDialog({ ...INITIAL_DELETE_DRAFT_STATE });
  };

  const handleSnackBarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackBar({ ...snackBar, open: false });
  };

  const createVersion = async (isMajor: boolean) => {
    await cqlLibraryServiceApi
      .createVersion(createVersionDialog.cqlLibraryId, isMajor)
      .then(async () => {
        handleDialogClose();
        await onListUpdate();
        setSnackBar({
          message: "New version of CQL Library is Successfully created",
          open: true,
          severity: "success",
        });
      })
      .catch((error) => {
        handleDialogClose();
        const errorData = error?.response?.data;
        if (errorData?.status == 400) {
          setSnackBar({
            message: "Requested Cql Library cannot be versioned",
            open: true,
            severity: "error",
          });
        } else if (errorData?.status == 403) {
          setSnackBar({
            message: "User is unauthorized to create a version",
            open: true,
            severity: "error",
          });
        } else {
          setSnackBar({
            message: errorData?.message,
            open: true,
            severity: "error",
          });
        }
      });
  };

  const createDraft = async (cqlLibrary: CqlLibrary) => {
    await cqlLibraryServiceApi
      .createDraft(cqlLibrary.id, cqlLibrary.cqlLibraryName)
      .then(async () => {
        handleDialogClose();
        await onListUpdate();
        setSnackBar({
          message: "New Draft of CQL Library is Successfully created",
          open: true,
          severity: "success",
        });
      })
      .catch((error) => {
        handleDialogClose();
        const errorData = error?.response?.data;
        if (errorData?.status == 400) {
          let message = "Requested Cql Library cannot be drafted.";
          if (error?.response?.data?.message) {
            message = `${message} ${error.response.data.message}`;
          }
          setSnackBar({
            message,
            open: true,
            severity: "error",
          });
        } else if (errorData?.status == 403) {
          setSnackBar({
            message: "User is unauthorized to create a draft",
            open: true,
            severity: "error",
          });
        } else {
          setSnackBar({
            message: errorData?.message,
            open: true,
            severity: "error",
          });
        }
      });
  };

  const deleteDraft = () => {
    cqlLibraryServiceApi
      .deleteDraft(deleteDraftDialog.cqlLibrary?.id)
      .then(async () => {
        handleDialogClose();
        await onListUpdate();
        setSnackBar({
          message: "The Draft CQL Library has been deleted.",
          open: true,
          severity: "success",
        });
      })
      .catch((error) => {
        handleDialogClose();
        const errorData = error?.response?.data;
        if (errorData?.status == 409) {
          setSnackBar({
            message:
              "This CQL Library is not in the correct state to be deleted.",
            open: true,
            severity: "error",
          });
        } else if (errorData?.status == 403) {
          setSnackBar({
            message: "User is not authorized to delete this CQL Library.",
            open: true,
            severity: "error",
          });
        } else {
          setSnackBar({
            message: errorData?.message,
            open: true,
            severity: "error",
          });
        }
      });
  };

  // Popover utilities
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCQLLibrary, setSelectedCqlLibrary] =
    useState<CqlLibrary>(null);
  const canEdit = checkUserCanEdit(
    selectedCQLLibrary?.librarySet?.owner,
    selectedCQLLibrary?.librarySet?.acls
  );
  const canDelete = checkUserCanDelete(
    selectedCQLLibrary?.librarySet?.owner,
    selectedCQLLibrary?.draft
  );
  const handleOpen = (
    selected: CqlLibrary,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setSelectedCqlLibrary(selected);
    setAnchorEl(event.currentTarget);
    setOptionsOpen(true);
  };
  const handleClose = () => {
    setOptionsOpen(false);
    setSelectedCqlLibrary(null);
    setAnchorEl(null);
  };

  const onDraftClicked = (selectedCQLLibrary: CqlLibrary) => {
    setCreateDraftDialog({
      open: true,
      cqlLibrary: selectedCQLLibrary,
    });
    setOptionsOpen(false);
    setAnchorEl(null);
  };

  return (
    <div data-testid="cqlLibrary-list">
      <Snackbar
        open={snackBar.open}
        autoHideDuration={6000}
        onClose={handleSnackBarClose}
        data-testid="cql-library-list-snackBar"
      >
        <Alert
          onClose={handleSnackBarClose}
          severity={snackBar.severity}
          sx={{ width: "100%" }}
        >
          {snackBar.message}
        </Alert>
      </Snackbar>
      <CreatVersionDialog
        open={createVersionDialog.open}
        onClose={handleDialogClose}
        onSubmit={createVersion}
        cqlLibraryError={createVersionDialog.cqlLibraryError}
        isCqlPresent={createVersionDialog.isCqlPresent}
      />
      <CreatDraftDialog
        open={createDraftDialog.open}
        onClose={handleDialogClose}
        onSubmit={createDraft}
        cqlLibrary={createDraftDialog.cqlLibrary}
      />
      <MadieDeleteDialog
        open={deleteDraftDialog.open}
        dialogTitle={`Delete draft of ${deleteDraftDialog.cqlLibrary?.cqlLibraryName}?`}
        name={`draft of ${deleteDraftDialog.cqlLibrary?.cqlLibraryName}`}
        onClose={() => setDeleteDraftDialog({ ...INITIAL_DELETE_DRAFT_STATE })}
        onContinue={deleteDraft}
      />
      <Popover
        open={optionsOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          ".MuiPopover-paper": {
            boxShadow: "none",
            overflow: "visible",
            ".popover-content": {
              border: "solid 1px #979797",
              position: "relative",
              marginTop: "16px",
              marginLeft: "-70px",
              borderRadius: "6px",
              background: "#F7F7F7",
              width: "115px",
              "&::before": {
                borderWidth: "thin",
                position: "absolute",
                top: "-8px",
                left: "calc(50% - 8px)",
                height: "16px",
                width: "16px",
                background: "#F7F7F7",
                borderColor: "#979797 transparent transparent #979797",
                content: '""',
                transform: "rotate(45deg)",
              },
              ".btn-container": {
                display: "flex",
                flexDirection: "column",
                padding: "10px 0",
                button: {
                  zIndex: 2,
                  fontSize: 14,
                  padding: "0px 12px",
                  textAlign: "left",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                  },
                },
              },
            },
          },
        }}
      >
        {selectedCQLLibrary && (
          <div className="popover-content" data-testid="popover-content">
            <div className="btn-container">
              <button
                onClick={() => {
                  history.push(
                    `/cql-libraries/${selectedCQLLibrary.id}/edit/details`
                  );
                }}
                data-testid={`edit-cql-library-button-${selectedCQLLibrary.id}-edit`}
              >
                {/* edit and version: must be draft and have ownership, else view only*/}
                {canEdit && selectedCQLLibrary.draft ? "Edit" : "View"}
              </button>
              {selectedCQLLibrary.draft && canEdit && (
                <button
                  data-testid={`create-new-version-${selectedCQLLibrary.id}-button`}
                  onClick={() => {
                    cqlLibraryServiceApi
                      .fetchCqlLibrary(selectedCQLLibrary.id)
                      .then((cqlLibrary) => {
                        setSelectedCqlLibrary(cqlLibrary);
                        setCreateVersionDialog({
                          open: true,
                          cqlLibraryId: cqlLibrary.id,
                          cqlLibraryError: cqlLibrary.cqlErrors,
                          isCqlPresent:
                            cqlLibrary && cqlLibrary.cql?.trim().length > 0,
                        });
                      })
                      .catch(() => {
                        setSnackBar({
                          message:
                            "An error occurred while fetching the CQL Library!",
                          open: true,
                          severity: "error",
                        });
                      });
                    setOptionsOpen(false);
                    setAnchorEl(null);
                  }}
                >
                  Version
                </button>
              )}

              {!selectedCQLLibrary.draft && canEdit && (
                <button
                  data-testid={`create-new-draft-${selectedCQLLibrary.id}-button`}
                  onClick={() => onDraftClicked(selectedCQLLibrary)}
                >
                  Draft
                </button>
              )}

              {canDelete && (
                <button
                  data-testid={`delete-existing-draft-${selectedCQLLibrary.id}-button`}
                  onClick={() => {
                    setDeleteDraftDialog({
                      open: true,
                      cqlLibrary: selectedCQLLibrary,
                    });
                    setOptionsOpen(false);
                    setAnchorEl(null);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </Popover>
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div>
              <table
                tw="min-w-full"
                style={{
                  borderTop: "solid 1px #8c8c8c",
                  borderBottom: "solid 1px #8c8c8c",
                }}
              >
                <thead tw="bg-slate">
                  <tr>
                    <th scope="col" className="col-header">
                      Name
                    </th>
                    <th scope="col" className="col-header">
                      Model
                    </th>
                    <th scope="col" className="col-header">
                      Version
                    </th>
                    <th scope="col" className="col-header">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody data-testid="table-body" className="table-body">
                  {cqlLibraryList?.map((cqlLibrary, i) => (
                    <tr
                      key={cqlLibrary.id}
                      data-testid="row-item"
                      style={{ borderTop: "solid 1px #8c8c8c" }}
                    >
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            history.push(
                              `/cql-libraries/${cqlLibrary.id}/edit/details`
                            )
                          }
                          data-testid={`cqlLibrary-button-${cqlLibrary.id}`}
                        >
                          {cqlLibrary.cqlLibraryName}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() =>
                            history.push(
                              `/cql-libraries/${cqlLibrary.id}/edit/details`
                            )
                          }
                          data-testid={`cqlLibrary-button-${cqlLibrary.id}-model`}
                        >
                          {cqlLibrary.model}
                        </button>
                      </td>
                      <td>
                        <p>
                          {cqlLibrary.draft && "Draft "}
                          {cqlLibrary.version}
                        </p>
                      </td>
                      <td>
                        <Button
                          variant="outline-secondary"
                          style={{ borderColor: "#c8c8c8" }}
                          onClick={(e) => {
                            handleOpen(cqlLibrary, e);
                          }}
                          data-testid={`view/edit-cqlLibrary-button-${cqlLibrary.id}`}
                          aria-label={`CQL Library ${cqlLibrary.cqlLibraryName} version ${cqlLibrary.version} draft status ${cqlLibrary.draft} View / Edit`}
                        >
                          View/Edit
                          <span>
                            <ExpandMoreIcon />
                          </span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
