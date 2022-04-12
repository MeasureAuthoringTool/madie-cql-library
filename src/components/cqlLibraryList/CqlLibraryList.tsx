import React, { useRef, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { useHistory } from "react-router-dom";
import CqlLibrary from "../../models/CqlLibrary";
import { Button } from "@madie/madie-components";
import CreatVersionDialog from "../createVersionDialog/CreateVersionDialog";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CreatDraftDialog from "../createDraftDialog/CreateDraftDialog";

const ErrorAlert = tw.div`bg-red-200 rounded-lg py-3 px-3 text-red-900 mb-3`;

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
  const [serverError, setServerError] = useState(undefined);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  const handleClose = () => {
    setCreateVersionDialog({ open: false, cqlLibraryId: "" });
    setCreateDraftDialog({ open: false, cqlLibrary: null });
  };

  const createVersion = async (isMajor: boolean) => {
    await cqlLibraryServiceApi
      .createVersion(createVersionDialog.cqlLibraryId, isMajor)
      .then(async () => {
        handleClose();
        await onListUpdate();
      })
      .catch((error) => {
        handleClose();
        const errorData = error?.response?.data;
        if (errorData?.status == 400) {
          setServerError("Requested Cql Library cannot be versioned");
        } else if (errorData?.status == 403) {
          setServerError("User is unauthorized to create a version");
        } else {
          setServerError(errorData?.message);
        }
      });
  };

  const createDraft = async (cqlLibrary: CqlLibrary) => {
    await cqlLibraryServiceApi
      .createDraft(cqlLibrary)
      .then(async () => {
        handleClose();
        await onListUpdate();
      })
      .catch((error) => {
        handleClose();
        const errorData = error?.response?.data;
        if (errorData?.status == 400) {
          setServerError("Requested Cql Library cannot be drafted");
        } else if (errorData?.status == 403) {
          setServerError("User is unauthorized to create a draft");
        } else {
          setServerError(errorData?.message);
        }
      });
  };

  return (
    <div data-testid="cqlLibrary-list">
      <CreatVersionDialog
        open={createVersionDialog.open}
        onClose={handleClose}
        onSubmit={createVersion}
      />
      <CreatDraftDialog
        open={createDraftDialog.open}
        onClose={handleClose}
        onSubmit={createDraft}
        cqlLibrary={createDraftDialog.cqlLibrary}
      />
      {serverError && (
        <ErrorAlert
          data-testid="cql-library-list-server-error-alerts"
          role="alert"
        >
          {serverError}
        </ErrorAlert>
      )}
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
