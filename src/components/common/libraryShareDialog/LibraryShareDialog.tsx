import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import GlobalStyles from "../../../styles/GlobalStyles";
import { Backdrop, Checkbox, Typography } from "@mui/material";
import {
  TextField,
  MadieDialog,
  Button,
  TruncateText,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import "./LibraryShareDialog.scss";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CqlLibrary } from "@madie/madie-models";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import tw from "twin.macro";
import "styled-components/macro";
import { useFormik } from "formik";
import * as Yup from "yup";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import {
  useOktaTokens,
  useIsRoleOrFeatureEnabled,
  useCqlLibraryServiceApi,
  useUserServiceApi,
} from "@madie/madie-util";

interface ShareDialogProps {
  libraries: CqlLibrary[];
  open: boolean;
  option: string;
  onClose: Function;
}

interface SharedLibrary {
  libraryId: string;
  cqlLibraryName: string;
  userId: string;
  dateShared: string;
  subRows: SharedLibrary[];
}

export interface SharedUser {
  userId: string;
  performedAt: Date;
}

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;
const icon = <CheckBoxOutlineBlankIcon fontSize="large" />;
const checkedIcon = <CheckBoxIcon fontSize="large" />;
const keyboardArrowStyles = {
  color: "#0073C8",
  width: 40,
  height: 40,
};

//Convert date string to format of mm/dd/yyyy with no leading zeroes in month
export const convertDate = (date: string) => {
  if (!date) {
    return "";
  }
  const dateObj = new Date(date);
  const year = dateObj.getUTCFullYear().toString();
  const month = String(dateObj.getUTCMonth() + 1);
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
};

export const sortSharedLibraries = (a: SharedLibrary, b: SharedLibrary) => {
  if (a.dateShared === "-" || b.dateShared === "-") {
    return -1;
  }

  return new Date(b.dateShared).getTime() - new Date(a.dateShared).getTime();
};

const getErrorMessage = (error, baseMessage: string) => {
  let toastMessage;

  if (error?.response?.data?.message) {
    toastMessage = error.response.data.message;
  } else {
    toastMessage = baseMessage;
  }

  return toastMessage;
};

const LibraryShareDialog = ({
  libraries,
  open,
  option,
  onClose,
}: ShareDialogProps) => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  const libraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const userServiceApi = useRef(useUserServiceApi()).current;

  const [loading, setLoading] = useState<boolean>(false);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [libraryMap, setLibraryMap] = useState(new Map<string, CqlLibrary>());
  const [sharedLibraries, setSharedLibraries] = useState<SharedLibrary[]>([]);
  const [sharedWithAllSelectedLibraries, setSharedWithAllSelectedLibraries] =
    useState<boolean>(false);
  const [shareLibrariesRequest, setShareLibrariesRequest] = useState(
    new Map<string, string[]>()
  );
  const [unshareLibrariesRequest, setUnshareLibrariesRequest] = useState(
    new Map<string, string[]>()
  );

  const [rowSelection, setRowSelection] = useState({});
  const [initialRowIdsSelected, setInitialRowIdsSelected] = useState([]);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);

  const showShareDialog = option === "Share With" || option === "Unshare";
  const isAdminShareLibraryEnabled =
    useIsRoleOrFeatureEnabled("AdminShareLibrary");

  useEffect(() => {
    if (option === "UnshareFromMe" && open) {
      setConfirmationDialogOpen(true);
    }
  }, [option, open]);

  const updateSharedLibrariesRequest = (libraryId, harpId) => {
    setShareLibrariesRequest((map) => {
      const current = map.get(libraryId) || [];
      current.push(harpId);

      return map.set(libraryId, current);
    });
  };

  const updateUnsharedLibrariesRequest = (libraryId, harpId) => {
    setUnshareLibrariesRequest((map) => {
      const current = map.get(libraryId) || [];
      current.push(harpId);

      return map.set(libraryId, current);
    });
  };

  const harpIdCheck = (isSharedWithAllSelectedLibraries: boolean) => {
    return {
      message: `The selected library(s) are already shared with this user.`,
      test: () => {
        return !isSharedWithAllSelectedLibraries;
      },
    };
  };

  const handleAddUser = async () => {
    // Remove all spaces from harpId
    const harpId = formik.getFieldProps("harpId").value.replace(/\s/g, "");

    // If no harpId is passed in (string with all whitespace), only clear out the harpId field
    if (!harpId) {
      formik.setFieldValue("harpId", "");
      return;
    }

    try {
      await userServiceApi.getOwnerDetails(harpId.toLowerCase());
    } catch (error) {
      // set error for haprId field
      formik.setFieldError(
        "harpId",
        "The provided HARP ID is not associated with an active MADiE user."
      );
      return;
    }

    let sharedWithAllSelectedLibraries = true;

    const updateSharedLibraries = sharedLibraries.map((library) => {
      if (
        library.subRows.length &&
        library.subRows.some(
          (subRow) => subRow.userId.toLowerCase() === harpId.toLowerCase()
        )
      ) {
        return { ...library };
      } else {
        sharedWithAllSelectedLibraries = false;

        updateSharedLibrariesRequest(library.libraryId, harpId);

        return {
          ...library,
          subRows: [
            {
              libraryId: library.libraryId,
              cqlLibraryName: "",
              userId: harpId,
              dateShared: new Date().toLocaleString(),
              subRows: null,
            },
            ...library.subRows,
          ],
        };
      }
    });

    setSharedLibraries(updateSharedLibraries);
    setSharedWithAllSelectedLibraries(sharedWithAllSelectedLibraries);

    if (!sharedWithAllSelectedLibraries) {
      setSaveDisabled(false);
      formik.resetForm();
    }
  };

  const getSharedLibrary = useCallback(async () => {
    if ((libraries && libraries?.length === 0) || !open) {
      return;
    }

    setSharedLibraries([]);
    setErrorMessage("");
    setLoading(true);

    const uniqueLibrarySets = Array.from(
      new Map(libraries.map((item) => [item.librarySetId, item])).values()
    );

    try {
      const responses =
        await libraryServiceApi.getRecentLibrariesByLibrarySetId(
          uniqueLibrarySets.map((librarySet) => librarySet.librarySetId)
        );
      const libraryIds = responses.map((library) => library.id);
      const libraryMap = new Map<string, CqlLibrary>(
        responses.map((library) => [library.id, library])
      );
      setLibraryMap(libraryMap);

      const sharedLibraries = await libraryServiceApi.getSharedLibraries(
        libraryIds
      );
      setSharedLibraries(
        libraryIds.map((libraryId: string) => ({
          libraryId,
          //@ts-ignore
          cqlLibraryName: libraryMap.get(libraryId).cqlLibraryName,
          userId: "",
          dateShared: null,
          subRows: sharedLibraries[libraryId]
            .map((sharedUser: SharedUser) => ({
              libraryId,
              userId: sharedUser.userId,
              dateShared: sharedUser.performedAt
                ? sharedUser.performedAt.toLocaleString()
                : "-",
            }))
            .sort(sortSharedLibraries),
        }))
      );

      table.toggleAllRowsSelected(true);
      setInitialRowIdsSelected(Object.keys(table.getState().rowSelection));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to retrieve users that the selected library(s) is shared with. If the error persists, please contact the help desk."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [open]);

  const handleSave = async () => {
    setConfirmationDialogOpen(false);
    setExecuting(true);

    if (option === "Share With") {
      try {
        await libraryServiceApi.shareLibraries(shareLibrariesRequest);

        onClose("success", "The Library(s) were successfully shared.");
      } catch (error) {
        onClose(
          "danger",
          getErrorMessage(
            error,
            "Unable to share the selected library(s) with the added users. If the error persists, please contact the help desk."
          )
        );
      } finally {
        setExecuting(false);
      }
    } else if (option === "Unshare" || option === "UnshareFromMe") {
      try {
        await libraryServiceApi.unshareLibraries(unshareLibrariesRequest);

        onClose("success", "The Library(s) were successfully unshared.");
      } catch (error) {
        onClose(
          "danger",
          getErrorMessage(
            error,
            "Unable to unshare the selected library(s) with the users who were unchecked. If the error persists, please contact the help desk."
          )
        );
      } finally {
        setExecuting(false);
      }
    }
  };

  const onRowSelectionChange = useCallback(async () => {
    if (option !== "Unshare") return;

    if (initialRowIdsSelected.length) {
      const rowIdsSelected = Object.keys(rowSelection);

      const rowIdsUnselected: string[] = initialRowIdsSelected.filter(
        (element) => !rowIdsSelected.includes(element)
      );

      setUnshareLibrariesRequest(new Map<string, string[]>());

      rowIdsUnselected.map((rowId) => {
        const [libraryId, userId] = rowId.split(" ");
        updateUnsharedLibrariesRequest(libraryId, userId);
      });
    }
  }, [rowSelection, option]);

  const confirmationDialogWarningContent = () => {
    let requestToUse = unshareLibrariesRequest;
    if (option === "UnshareFromMe" && unshareLibrariesRequest.size === 0) {
      const directUnshareRequest = new Map<string, string[]>();
      libraries.forEach((library) => {
        directUnshareRequest.set(library.id, [userName]);
        setUnshareLibrariesRequest(directUnshareRequest);
      });
      requestToUse = directUnshareRequest;
    }
    return (
      <div>
        <div className="confirmation-dialog-content">
          You are about to unshare
        </div>
        {Array.from(requestToUse).map(([libraryId, userIds]) => (
          <div className="confirmation-dialog-content" key={libraryId}>
            <div className="library-name">
              {libraryMap.get(libraryId)
                ? libraryMap.get(libraryId).cqlLibraryName
                : libraryId}
            </div>
            <div> with the following users:</div>
            <ul>
              {userIds.map((userId) => (
                <li key={userId}>{userId}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const formik = useFormik({
    initialValues: {
      harpId: "",
    },
    validationSchema: Yup.object().shape({
      harpId: Yup.string().test(harpIdCheck(sharedWithAllSelectedLibraries)),
    }),
    onSubmit: () => {
      option === "Share With" ? handleSave() : setConfirmationDialogOpen(true);
    },
  });

  const columns = useMemo<ColumnDef<SharedLibrary>[]>(() => {
    let columnDefs = [];

    if (option === "Share With") {
      columnDefs.push({
        header: "Library",
        cell: (info) => (
          <TruncateText
            text={info.row.original.cqlLibraryName}
            maxLength={120}
            dataTestId={`library-name-${info.row.original.cqlLibraryName}_${info.row.original.libraryId}`}
          />
        ),
        accessorKey: "cqlLibraryName",
      });
    } else if (option === "Unshare") {
      columnDefs.push({
        header: "Library",
        cell: (info) =>
          info.row.original.cqlLibraryName ? (
            <TruncateText
              text={info.row.original.cqlLibraryName}
              maxLength={120}
              dataTestId={`library-name-${info.row.original.cqlLibraryName}_${info.row.original.libraryId}`}
            />
          ) : (
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              checked={info.row.getIsSelected()}
              onChange={info.row.getToggleSelectedHandler()}
              data-testid={`unshare-checkbox-${info.row.original.userId}_${info.row.original.libraryId}`}
            />
          ),
        accessorKey: "cqlLibraryName",
      });
    }

    columnDefs = [
      ...columnDefs,
      {
        header: "User",
        cell: (info) => (
          <TruncateText
            text={info.row.original.userId}
            maxLength={120}
            dataTestId={`user-${info.row.original.userId}_${info.row.original.libraryId}`}
          />
        ),
        accessorKey: "userId",
      },
      {
        header: "Date Shared",
        cell: (info) => (
          <TruncateText
            text={
              info.row.original.dateShared === "-"
                ? "-"
                : info.row.original.dateShared
                ? convertDate(info.row.original.dateShared)
                : ""
            }
            maxLength={120}
            dataTestId={`date-shared-${info.row.original.dateShared}_${info.row.original.libraryId}`}
          />
        ),
        accessorKey: "dateShared",
      },
      {
        cell: ({ row }) => (
          <>
            {row.getCanExpand() ? (
              <button
                type="button"
                data-testid={`expand-button-${row.original.libraryId}`}
                onClick={row.getToggleExpandedHandler()}
                style={{ cursor: "pointer" }}
              >
                {row.getIsExpanded() ? (
                  <KeyboardArrowDownIcon sx={keyboardArrowStyles} />
                ) : (
                  <KeyboardArrowRightIcon sx={keyboardArrowStyles} />
                )}
              </button>
            ) : null}
          </>
        ),
        id: "expandButton",
      },
    ];

    return columnDefs;
  }, [libraries]);

  const table = useReactTable({
    data: sharedLibraries,
    getRowId: (row) => `${row.libraryId}${row.userId ? ` ${row.userId}` : ""}`,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  useEffect(() => {
    getSharedLibrary();
  }, [getSharedLibrary]);

  useEffect(() => {
    formik.validateForm();
  }, [sharedWithAllSelectedLibraries]);

  useEffect(() => {
    onRowSelectionChange();
  }, [table.getState().rowSelection]);

  useEffect(() => {
    setSaveDisabled(true);
    setShareLibrariesRequest(new Map<string, string[]>());
    setUnshareLibrariesRequest(new Map<string, string[]>());
    setInitialRowIdsSelected([]);
    table.resetRowSelection();
    table.resetExpanded();
    formik.resetForm();
  }, [onClose]);

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);

    // Also close underlying Share/Unshare dialog
    if (option === "UnshareFromMe") {
      onClose();
    }
  };

  const handleExportUserList = () => {
    // to be implemented - will trigger export of user list for admin in Share With and Unshare dialogs
  };
  const getAdminUserExportButton = () => {
    if (isAdminShareLibraryEnabled) {
      return (
        <Button
          className="export-button"
          data-testid="export-user-list-button"
          onClick={handleExportUserList}
        >
          <SaveAltIcon sx={{ marginRight: "8px" }} />
          <span className="export-button-text">Export User List (.CSV)</span>
        </Button>
      );
    }
  };

  return (
    <>
      <GlobalStyles />
      <MadieDialog
        form
        title={option}
        dialogProps={{
          onClose,
          open: showShareDialog && open,
          onSubmit: formik.handleSubmit,
          maxWidth: "lg",
          "data-testid": "share-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "share-cancel-button",
          disabled: executing,
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          continueText: "Save",
          "data-testid": "share-save-button",
          disabled:
            option === "Share With"
              ? saveDisabled || !formik.isValid || executing
              : table.getIsAllRowsSelected() || executing,
        }}
      >
        <div id="library-landing" data-testid="library-landing">
          {option === "Share With" && (
            <div id="add-user-id-search">
              <div>
                <TextField
                  label="HARP ID"
                  id="harp-id-input"
                  inputProps={{
                    "data-testid": "harp-id-input",
                  }}
                  error={Boolean(formik.errors.harpId)}
                  helperText={formik.errors.harpId}
                  onFocus={() => setSharedWithAllSelectedLibraries(false)}
                  {...formik.getFieldProps("harpId")}
                />
              </div>
              <div>
                <Button
                  id="add-user-btn"
                  data-testid="add-user-btn"
                  variant="outline"
                  disabled={
                    !formik.getFieldProps("harpId").value || !formik.isValid
                  }
                  onClick={handleAddUser}
                >
                  Add User
                </Button>
              </div>
            </div>
          )}
          <div className="share-unshare-dialog-info-text">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                When sharing a Library, all versions and drafts are shared, so
                only the most recent library name appears here.
              </div>
              {option === "Unshare" && (
                <div>
                  Deselect the users with whom you want to unshare the
                  library(s).
                </div>
              )}
            </div>
            {getAdminUserExportButton()}
          </div>
          <div className="cql-library-table">
            <div className="table" style={{ overflow: "auto" }}>
              <table
                tw="min-w-full"
                data-testid="share-library-tbl"
                className="ml-table"
                style={{
                  borderSpacing: "0 2em !important",
                  borderBottom: "1px solid rgb(140, 140, 140)",
                }}
              >
                <thead tw="bg-slate">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TH
                            key={header.id}
                            scope="col"
                            className="header-cell"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </TH>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="table-body" style={{ padding: 20 }}>
                  {errorMessage ? (
                    <tr>
                      <td colSpan={columns.length}>{errorMessage}</td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={
                          row.original.cqlLibraryName
                            ? String.raw`ml-tr`
                            : String.raw`ml-tr subtr`
                        }
                        data-testid={`row-item`}
                        style={{
                          borderTop: "solid 1px #8c8c8c",
                          borderSpacing: "0 2em !important",
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} data-testid={`${cell.id}`}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading || executing}
        >
          <MadieSpinner style={{ height: 50, width: 50 }} />
          {loading && (
            <Typography color="inherit">Loading shared libraries...</Typography>
          )}
          {executing && <Typography color="inherit">Saving...</Typography>}
        </Backdrop>
      </MadieDialog>

      <MadieDialog
        title="Are you sure?"
        dialogProps={{
          open: confirmationDialogOpen,
          onClose: handleConfirmationDialogClose,
          "data-testid": "share-confirmation-dialog",
        }}
        cancelButtonProps={{
          onClick: handleConfirmationDialogClose,
          cancelText: "Cancel",
          "data-testid": "share-confirmation-dialog-cancel-button",
        }}
        continueButtonProps={{
          type: "submit",
          continueText: "Accept",
          onClick: handleSave,
          "data-testid": "share-confirmation-dialog-accept-button",
        }}
      >
        <div id="discard-changes-dialog-body">
          <section className="dialog-warning-body">
            {confirmationDialogWarningContent()}
          </section>
        </div>
      </MadieDialog>
    </>
  );
};

export default LibraryShareDialog;
