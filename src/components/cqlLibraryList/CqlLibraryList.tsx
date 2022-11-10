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
import { useOktaTokens } from "@madie/madie-util";
import { Button } from "@madie/madie-design-system/dist/react";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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
      .createDraft(cqlLibrary)
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

  // Popover utilities
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCQLLibrary, setSelectedCqlLibrary] =
    useState<CqlLibrary>(null);
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
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

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
                {selectedCQLLibrary.createdBy === userName &&
                selectedCQLLibrary.draft
                  ? "Edit"
                  : "View"}
              </button>
              {selectedCQLLibrary.draft &&
                selectedCQLLibrary.createdBy === userName && (
                  <button
                    data-testid={`create-new-version-${selectedCQLLibrary.id}-button`}
                    onClick={() => {
                      setCreateVersionDialog({
                        open: true,
                        cqlLibraryId: selectedCQLLibrary.id,
                        cqlLibraryError: selectedCQLLibrary.cqlErrors,
                        isCqlPresent:
                          selectedCQLLibrary &&
                          selectedCQLLibrary.cql?.trim().length > 0,
                      });
                      setOptionsOpen(false);
                      setAnchorEl(null);
                    }}
                  >
                    Version
                  </button>
                )}

              {!selectedCQLLibrary.draft &&
                selectedCQLLibrary.createdBy === userName && (
                  <button
                    data-testid={`create-new-draft-${selectedCQLLibrary.id}-button`}
                    onClick={() => {
                      setCreateDraftDialog({
                        open: true,
                        cqlLibrary: selectedCQLLibrary,
                      });
                      setOptionsOpen(false);
                      setAnchorEl(null);
                    }}
                  >
                    Draft
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
              <table tw="min-w-full" style={{ borderTop: "solid 1px #DDD" }}>
                <thead>
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
                      className={i % 2 === 0 ? "odd" : ""}
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
                          onClick={(e) => {
                            handleOpen(cqlLibrary, e);
                          }}
                          data-testid={`view/edit-cqlLibrary-button-${cqlLibrary.id}`}
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
