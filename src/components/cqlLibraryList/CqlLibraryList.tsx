import React, { useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { useHistory } from "react-router-dom";
import CqlLibrary from "../../models/CqlLibrary";
import { Button } from "@madie/madie-components";
import CreatVersionDialog from "../createVersionDialog/CreateVersionDialog";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CreatDraftDialog from "../createDraftDialog/CreateDraftDialog";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";

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
    setCreateVersionDialog({ open: false, cqlLibraryId: "" });
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
      />
      <CreatDraftDialog
        open={createDraftDialog.open}
        onClose={handleDialogClose}
        onSubmit={createDraft}
        cqlLibrary={createDraftDialog.cqlLibrary}
      />
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div tw="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table tw="min-w-full divide-y divide-gray-200">
                <thead tw="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Model
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Version
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cqlLibraryList?.map((cqlLibrary) => (
                    <tr key={cqlLibrary.id} tw="bg-white">
                      <td tw="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          type="button"
                          onClick={() =>
                            history.push(`/cql-libraries/${cqlLibrary.id}/edit`)
                          }
                          data-testid={`cqlLibrary-button-${cqlLibrary.id}`}
                        >
                          {cqlLibrary.cqlLibraryName}
                        </button>
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          type="button"
                          onClick={() =>
                            history.push(`/cql-libraries/${cqlLibrary.id}/edit`)
                          }
                          data-testid={`cqlLibrary-button-${cqlLibrary.id}-model`}
                        >
                          {cqlLibrary.model}
                        </button>
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <p>
                          {cqlLibrary.draft && "Draft "}
                          {cqlLibrary.version}
                        </p>
                      </td>
                      {cqlLibrary.draft ? (
                        <Button
                          buttonTitle="Version"
                          tw="h-10"
                          onClick={() => {
                            setCreateVersionDialog({
                              open: true,
                              cqlLibraryId: cqlLibrary.id,
                            });
                          }}
                          data-testid={`create-new-version-${cqlLibrary.id}-button`}
                        />
                      ) : (
                        <Button
                          buttonTitle="Draft"
                          tw="h-10"
                          onClick={() => {
                            setCreateDraftDialog({
                              open: true,
                              cqlLibrary,
                            });
                          }}
                          data-testid={`create-new-draft-${cqlLibrary.id}-button`}
                        />
                      )}
                      <td tw="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            history.push(`/cql-libraries/${cqlLibrary.id}/edit`)
                          }
                          tw="text-blue-600 hover:text-blue-900"
                          data-testid={`edit-cqlLibrary-${cqlLibrary.id}`}
                        >
                          Edit
                        </button>
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
