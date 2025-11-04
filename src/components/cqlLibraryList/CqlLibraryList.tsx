import React, {
  useMemo,
  useState,
  useRef,
  HTMLProps,
  forwardRef,
  useEffect,
  SyntheticEvent,
  MouseEvent,
  useCallback,
} from "react";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import Popover from "@mui/material/Popover";
import "twin.macro";
import "styled-components/macro";
import { CqlLibrary } from "@madie/madie-models";
import CreatVersionDialog from "../createVersionDialog/CreateVersionDialog";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CreateDraftDialog from "../createDraftDialog/CreateDraftDialog";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import {
  checkUserCanDelete,
  checkUserCanEdit,
  useFeatureFlags,
} from "@madie/madie-util";
import {
  Button,
  MadieDeleteDialog,
  Pagination,
  TruncateText,
  MadieTooltip,
} from "@madie/madie-design-system/dist/react";
import LibraryShareDialog from "../common/libraryShareDialog/LibraryShareDialog";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import { CollapseIcon, ExpandIcon } from "./LibraryListTableRightArrowIcons";
import * as _ from "lodash";
import { Chip } from "@mui/material";
import TransferDialog from "../common/transferDialog/TransferDialog";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import "./CqlLibraryList.scss";
import { INITIAL_STATUS_HANDLER } from "../editCqlLibrary/statusHandler/StatusHandler";

export const TRANSFER_LIBRARY_SUCCESS =
  "The library(s) were successfully transferred. If you chose to retain share access, you will still be able to edit the libraries.";
export const TRANSFER_LIBRARY_FAILURE =
  "Unable to transfer the selected library(s) to the harpId. If the error persists, please contact the help desk.";

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const INITIAL_DELETE_DRAFT_STATE = {
  open: false,
  cqlLibrary: null,
};

export function sortResults(data, sortBy, descending = false) {
  // no sort, return same
  if (!sortBy) return data;
  return [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    // decide how to sort based on type
    if (typeof aValue === "string" && typeof bValue === "string") {
      //and direction
      return descending
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    }
    //type
    return descending //direction
      ? (bValue as any) - (aValue as any)
      : (aValue as any) - (bValue as any);
  });
}

function IndeterminateCheckbox({
  indeterminate,
  className = "",
  onChange,
  id,
  ...rest
}: {
  indeterminate?: boolean;
} & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + " cursor-pointer"}
      onChange={onChange}
      {...rest}
    />
  );
}

export default function CqlLibraryList({
  cqlLibraryList = [],
  onListUpdate,
  setSelectedLibraries,
  deleteDraftDialog,
  setDeleteDraftDialog,
  selectedCQLLibrary,
  setSelectedCqlLibrary,
  createVersionDialog,
  setCreateVersionDialog,
  createDraftDialog,
  shareDialog,
  setShareDialog,
  transferDialog,
  setTransferDialog,
  setCreateDraftDialog,
  setOwners,
  setSnackBar,
  snackBar,
  totalItems,
  activeTab,
  totalPages,
  visibleItems,
  offset,
  sorting,
  handleSort,
  handlePageChange,
  curLimit,
  curPage,
  searchCriteria,
  setToastOpen,
  setToastMessage,
  setToastType,
  setStatusHandler,
}) {
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [selectedIdForExpansion, setSelectedIdForExpansion] = useState(null);
  const [isRowExpanded, setIsRowExpanded] = useState<boolean>(false);
  const [selectedExpandedLibrariesIds, setSelectedExpandedLibrariesIds] =
    useState([]);
  const [expandedSectionData, setExpandedSectionData] = useState<CqlLibrary[]>(
    []
  );
  const featureFlags = useFeatureFlags();
  const navigate = useNavigate();
  const { search } = useLocation();
  const values = queryString.parse(search);

  const handleLimitChange = (e) => {
    navigate(`?tab=${activeTab}&page=1&limit=${e.target.value}`);
  };

  useEffect(() => {
    const cqlLibraryPageOptions = JSON.parse(
      window.localStorage.getItem("cqlLibraryPageOptions")
    );

    if (cqlLibraryPageOptions) {
      if (
        !Object.keys(values).length &&
        Object.keys(cqlLibraryPageOptions).length
      ) {
        const { page, limit } = cqlLibraryPageOptions;
        navigate(`?tab=${activeTab}&page=${page}&limit=${limit}`);
      }
    }
  }, [values, navigate, activeTab]);

  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  // pull info from some query url
  // const curPage = (values.page && Number(values.page)) || 1;
  // can we do stuff
  const canGoNext = (() => {
    return curPage < totalPages;
  })();
  const canGoPrev = Number(values?.page) > 1;
  const handleDialogClose = () => {
    setCreateVersionDialog({
      open: false,
      cqlLibraryId: "",
      cqlLibraryError: "",
      isCqlPresent: true,
    });
    setCreateDraftDialog({ open: false, cqlLibrary: null });
    setDeleteDraftDialog({ ...INITIAL_DELETE_DRAFT_STATE });
    setTransferDialog({ open: false, libraries: [] });
  };

  const handleSnackBarClose = (
    event?: SyntheticEvent | Event,
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
        table.resetRowSelection();
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

  const createDraft = async (cqlLibrary: CqlLibrary, model: string) => {
    await cqlLibraryServiceApi
      .createDraft(cqlLibrary.id, cqlLibrary.cqlLibraryName, model)
      .then(async () => {
        handleDialogClose();
        await onListUpdate();
        table.resetRowSelection();
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

  const deleteDraft = async () => {
    await cqlLibraryServiceApi
      .deleteDraft(deleteDraftDialog.cqlLibrary?.id)
      .then(async () => {
        handleDialogClose();
        const values = queryString.parse(search);
        const currentLimit = values.limit === "All" ? 50 : values.limit;

        localStorage.setItem(
          "cqlLibraryPageOptions",
          JSON.stringify({
            page: values.page || 1,
            limit: currentLimit,
          })
        );
        navigate(
          `?tab=${activeTab}&page=${values.page || 1}&limit=${currentLimit}`
        );

        await onListUpdate();
        table.resetRowSelection();
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
  const transferLibraries = (newOwner: string, retainShareAccess: boolean) => {
    setStatusHandler(INITIAL_STATUS_HANDLER);

    const libraryIds = selectedLibraries.map((lib) => lib.id);
    return cqlLibraryServiceApi
      .transferLibraries(libraryIds, newOwner, retainShareAccess)
      .then((response) => {
        if (response.status === 200) {
          setToastOpen(true);
          setToastType("success");
          setToastMessage(TRANSFER_LIBRARY_SUCCESS);
        } else if (response.status === 207) {
          const failedLibraryIds: string[] = response.data;

          const failedLibraryNames = selectedLibraries
            .filter((lib) => failedLibraryIds.includes(lib.id))
            .map((lib) => lib.cqlLibraryName);

          setStatusHandler({
            warning: {
              status: true,
              primaryMessage: `${failedLibraryNames?.length} Libraries could not be transferred. Please try again, or contact help desk if the issue persists.`,
              secondaryMessages: failedLibraryNames,
            },
          });
        }

        onListUpdate();
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

  // Popover utilities
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
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
    event: MouseEvent<HTMLButtonElement>
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

  const columnsToBeAdded = [
    {
      header: "Name",
      accessorKey: "cqlLibraryName",
      cell: (info) => (
        <>
          <TruncateText
            text={info.row.original.cqlLibraryName}
            maxLength={60}
            dataTestId={`cqlLibrary-button-${info.row.original.id}`}
          />
        </>
      ),
    },
    {
      header: "Model",
      accessorKey: "model",
      cell: (info) => (
        <>
          <TruncateText
            text={info.row.original.model}
            maxLength={60}
            dataTestId={`cqlLibrary-button-${info.row.original.id}-model`}
          />
        </>
      ),
    },
    {
      header: "Version",
      accessorKey: "version",
      cell: (info) => (
        <>
          <TruncateText
            text={info.row.original.version}
            maxLength={60}
            dataTestId={`cqlLibrary-button-${info.row.original.id}-version`}
          />
          {`${info.row.original.draft}` === "true" && (
            <Chip tw="ml-6" className="chip-draft" label="Draft" />
          )}
        </>
      ),
    },
    {
      header: () => (
        <button tabIndex={-1} aria-label="Edit or View Library">
          Action
        </button>
      ),
      accessorKey: "Actions",
      cell: (info) => (
        <Button
          variant="outline-secondary"
          style={{ borderColor: "#c8c8c8" }}
          onClick={() =>
            navigate(`/cql-libraries/${info.row.original.id}/edit/details`)
          }
          data-testid={
            checkUserCanEdit(
              info.row.original.librarySet?.owner,
              info.row.original.librarySet?.acls
            ) && info.row.original.draft
              ? `edit-cql-library-button-${info.row.original.id}`
              : `view-cql-library-button-${info.row.original.id}`
          }
          aria-live="polite"
          aria-label={`${
            checkUserCanEdit(
              info.row.original.librarySet?.owner,
              info.row.original.librarySet?.acls
            ) && info.row.original.draft
              ? `Edit`
              : `View`
          } Library ${info.row.original.cqlLibraryName} ${
            info.row.original.version
          }${info.row.original.draft ? " Draft" : ""}`}
          tabIndex={0}
          role="button"
        >
          {checkUserCanEdit(
            info.row.original.librarySet?.owner,
            info.row.original.librarySet?.acls
          ) && info.row.original.draft
            ? "Edit"
            : "View"}
        </Button>
      ),
    },
  ];
  const columnsBehindFlag = [
    {
      header: "Library",
      accessorKey: "cqlLibraryName",
      cell: (info) => (
        <TruncateText
          text={info.row.original.cqlLibraryName}
          maxLength={60}
          dataTestId={`cqlLibrary-button-${info.row.original.id}`}
        />
      ),
    },
    {
      header: "Version",
      accessorKey: "version",
      cell: (info) => (
        <TruncateText
          text={info.row.original.version}
          maxLength={60}
          dataTestId={`cqlLibrary-button-${info.row.original.id}-version`}
        />
      ), // Removed draft status text
    },
    {
      sortDescFirst: false, // This needs to be added because tanstack implicitly starts desc true bc of many nulls
      header: "Status",
      accessorKey: "draft",
      cell: (info) => (
        <div>
          {info.row.original.draft && (
            <Chip className="chip-draft" label="Draft" />
          )}
        </div>
      ),
    },
    {
      header: "Model",
      accessorKey: "model",
      cell: (info) => (
        <>
          <TruncateText
            text={info.row.original.model}
            maxLength={60}
            dataTestId={`cqlLibrary-button-${info.row.original.id}-model`}
          />
        </>
      ),
    },
    // Do not display Shared column in Shared Libraries tab
    ...(activeTab !== 1
      ? [
          {
            sortDescFirst: false, // This needs to be added because tanstack implicitly starts desc true bc of many nulls
            header: "Shared",
            accessorKey: "librarySet.acls",
            cell: (info) => (
              <p>
                {info.row.original.librarySet?.acls?.length > 0 && (
                  <CheckCircleOutlineIcon sx={{ color: "#4CAF50" }} />
                )}
              </p>
            ),
          },
        ]
      : []),
    {
      header: "Updated",
      accessorKey: "lastModifiedAt",
      cell: (info) => (
        <p>{new Date(info.row.original.lastModifiedAt).toLocaleDateString()}</p>
      ),
    },
    {
      header: () => (
        <button tabIndex={-1} aria-label="Edit or View Library">
          Action
        </button>
      ),
      accessorKey: "Actions",
      enableSorting: false,
      cell: (info) => (
        <Button
          variant="outline-secondary"
          style={{ borderColor: "#c8c8c8" }}
          onClick={() =>
            navigate(`/cql-libraries/${info.row.original.id}/edit/details`)
          }
          data-testid={
            checkUserCanEdit(
              info.row.original.librarySet?.owner,
              info.row.original.librarySet?.acls
            ) && info.row.original.draft
              ? `edit-cql-library-button-${info.row.original.id}`
              : `view-cql-library-button-${info.row.original.id}`
          }
          aria-label={`${
            checkUserCanEdit(
              info.row.original.librarySet?.owner,
              info.row.original.librarySet?.acls
            ) && info.row.original.draft
              ? `Edit`
              : `View`
          } Library ${info.row.original.cqlLibraryName} ${
            info.row.original.version
          }${info.row.original.draft ? " Draft" : ""}`}
          aria-live="polite"
          tabIndex={0}
          role="button"
        >
          {checkUserCanEdit(
            info.row.original.librarySet?.owner,
            info.row.original.librarySet?.acls
          ) && info.row.original.draft
            ? "Edit"
            : "View"}
        </Button>
      ),
    },
  ];

  const getHeader = () => {
    if (activeTab === 0) {
      return (
        <IndeterminateCheckbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      );
    } else {
      return (
        <MadieTooltip
          tooltipText="Select"
          id={`library-list-select-tooltip`}
          tabIndex={-1}
        />
      );
    }
  };

  const columns = useMemo<ColumnDef<CqlLibrary>[]>(() => {
    const columnDefs = [];

    columnDefs.push({
      id: "select",
      accessorKey: "select",
      enableSorting: false,
      header: () => <div aria-label="Library Selection">{getHeader()}</div>,
      cell: ({ row }) => {
        return (
          <div className="px-1">
            {
              <IndeterminateCheckbox
                {...{
                  checked: row.getIsSelected(),
                  disabled: !row.getCanSelect(),
                  indeterminate: row.getIsSomeSelected(),
                  onChange: row.getToggleSelectedHandler(),
                  id: row.original.id,
                }}
              />
            }
          </div>
        );
      },
    });

    columnDefs.push(
      ...(featureFlags?.LibrarySearch ? columnsBehindFlag : columnsToBeAdded)
    );

    if (featureFlags?.LibrarySearch) {
      columnDefs.push({
        header: "",
        cell: (info) => {
          if (info.row.original?.hasAssociatedLibraries) {
            const handleKeyDown = (e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSelectedExpandedLibrariesIds([]);
                handleRowClick(info.row.original);
              }
            };
            return (
              <span
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedExpandedLibrariesIds([]);
                  handleRowClick(info.row.original);
                }}
                onKeyDown={handleKeyDown}
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isRowExpanded &&
                selectedIdForExpansion === info.row.original.librarySetId ? (
                  <CollapseIcon />
                ) : (
                  <ExpandIcon />
                )}
              </span>
            );
          } else {
            return <></>;
          }
        },
        accessorKey: "expandArrow",
        enableSorting: false,
      });
    }

    return columnDefs;
  }, [
    navigate,
    featureFlags?.LibrarySearch,
    selectedIdForExpansion,
    isRowExpanded,
  ]);

  const expandedColumns = useMemo<ColumnDef<CqlLibrary>[]>(() => {
    return [
      {
        id: "select",
        accessorKey: "select",
        cell: (info) => {
          const isChecked = selectedExpandedLibrariesIds.includes(
            info.row.original.id
          );
          return (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(event) => {
                const checked = event.target.checked;
                if (checked) {
                  setSelectedExpandedLibrariesIds((prev) => [
                    ...prev,
                    info.row.original.id,
                  ]);
                } else {
                  setSelectedExpandedLibrariesIds((prev) =>
                    prev.filter((id) => id !== info.row.original.id)
                  );
                }
              }}
            />
          );
        },
      },
      ...(featureFlags?.LibrarySearch ? columnsBehindFlag : columnsToBeAdded),
      {
        header: "",
        cell: (info) => <></>,
        accessorKey: "",
      },
    ];
  }, [selectedExpandedLibrariesIds, isRowExpanded]);

  const table = useReactTable({
    data: cqlLibraryList ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: {
      sorting,
    },
    onSortingChange: handleSort,
  });
  const parentLibraries =
    cqlLibraryList?.filter((library) => {
      return table
        .getSelectedRowModel()
        .rows.find((row) => row.original.id === library.id);
    }) || [];

  const expandedLibraries = selectedExpandedLibrariesIds?.map(
    (expandedLibraryId) => {
      return expandedSectionData?.find(
        (data) => data?.id === expandedLibraryId
      );
    }
  );

  const selectedLibraries =
    parentLibraries?.length === 0 && expandedLibraries?.length === 0
      ? []
      : [
          ...parentLibraries,
          ...expandedLibraries?.filter(
            (expLibrary) => expLibrary !== undefined
          ),
        ];

  const handleRowClick = async (actions) => {
    if (!isRowExpanded || selectedIdForExpansion !== actions?.librarySetId) {
      setSelectedIdForExpansion(actions?.librarySetId);
      const optionalParams = searchCriteria?.optionalSearchProperties ?? [];
      const firstParam = _.trim(optionalParams[0]);

      const modifiedSearchCriteria = {
        ...searchCriteria,
        optionalSearchProperties:
          firstParam && firstParam !== "-" ? [_.camelCase(firstParam)] : [],
      };
      const results = await cqlLibraryServiceApi.getLibrariesByLibrarySetId(
        actions?.librarySetId,
        true,
        modifiedSearchCriteria
      );
      let filteredResults = results.filter(
        (result) => result.id !== actions?.id
      );
      //property version is a string here. does not appear to work as expected.
      const sortBy = sorting?.[0]?.id; // string for property to sort
      const descending = sorting?.[0]?.desc; // bool whether the list should be descending
      if (sortBy) {
        filteredResults = sortResults(filteredResults, sortBy, descending);
      }

      setIsRowExpanded(true);
      setExpandedSectionData(filteredResults);
    } else {
      setIsRowExpanded(false);
      setExpandedSectionData(null);
      setSelectedIdForExpansion(null);
    }
  };

  useEffect(() => {
    setSelectedLibraries(selectedLibraries);
    const getAllOwners = async () => {
      const getOwners = async () => {
        if (selectedLibraries?.length > 0) {
          return await cqlLibraryServiceApi.fetchAllOwners(
            selectedLibraries?.map((lib) => lib.librarySetId)
          );
        }
      };

      const owners = await getOwners();
      setOwners(owners);
    };

    getAllOwners();
  }, [selectedLibraries?.length, setSelectedLibraries]);

  const handleShareDialogClose = useCallback(
    async (type, message) => {
      setShareDialog({
        open: false,
        option: "",
      });

      if (!_.isEmpty(message)) {
        setSnackBar({
          message: message,
          open: true,
          severity: type,
        });
        if (message.includes("successfully")) {
          await onListUpdate();
          table.resetRowSelection();
        }
      }
    },
    [shareDialog]
  );

  const isButton = (header) => {
    return (
      header.column.columnDef.header !== "Action" &&
      !header.column.columnDef.header
        .toString()
        .includes("Library Selection") &&
      header.column.columnDef.header !== "select" &&
      header.column.columnDef.header !== ""
    );
  };
  return (
    <div data-testid="cqlLibrary-list">
      {snackBar.message !== "backdropClick" &&
        snackBar.message !== "escapeKeyDown" && (
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
        )}
      <CreatVersionDialog
        open={createVersionDialog.open}
        onClose={handleDialogClose}
        onSubmit={createVersion}
        cqlLibraryError={createVersionDialog.cqlLibraryError}
        isCqlPresent={createVersionDialog.isCqlPresent}
      />
      <CreateDraftDialog
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
      <LibraryShareDialog
        libraries={selectedLibraries}
        open={shareDialog.open}
        option={shareDialog.option}
        onClose={handleShareDialogClose}
      />
      <TransferDialog
        libraries={selectedLibraries}
        open={transferDialog.open}
        onClose={handleDialogClose}
        onSubmit={transferLibraries}
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
                  navigate(
                    `/cql-libraries/${selectedCQLLibrary.id}/edit/details`
                  );
                }}
                data-testid={`edit-cql-library-button-${selectedCQLLibrary.id}-edit`}
              >
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
                className="ll-table"
                id="libraryListTable"
                style={{
                  borderTop: "solid 1px #8c8c8c",
                  borderBottom: "solid 1px #8c8c8c",
                }}
              >
                <thead tw="bg-slate">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const button = isButton(header);
                        const isHovered = hoveredHeader?.includes(header.id);
                        return (
                          <th
                            key={header.id}
                            data-testId={`header-${header.id}`}
                            scope="col"
                            role={button ? "button" : ""}
                            tabIndex={button ? 0 : undefined}
                            className="col-header"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (button) {
                                  const handler =
                                    header.column.getToggleSortingHandler();
                                  handler(e);
                                }
                              }
                            }}
                            onClick={
                              button
                                ? (e) =>
                                    header.column.getToggleSortingHandler()(e)
                                : undefined
                            }
                            style={button ? { cursor: "pointer" } : null}
                            onMouseEnter={() => setHoveredHeader(header.id)}
                            onMouseLeave={() => setHoveredHeader(null)}
                            title={
                              header.column.getCanSort()
                                ? header.column.getNextSortingOrder() === "asc"
                                  ? "Sort ascending"
                                  : header.column.getNextSortingOrder() ===
                                    "desc"
                                  ? "Sort descending"
                                  : "Clear sort"
                                : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}

                            <span className="arrowDisplay">
                              {header.column.getCanSort() ? (
                                header.column.getIsSorted() === "asc" ? (
                                  <KeyboardArrowUpIcon />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <KeyboardArrowDownIcon />
                                ) : isHovered ? (
                                  <UnfoldMoreIcon />
                                ) : (
                                  // Always render a transparent icon to reserve space
                                  <span style={{ visibility: "hidden" }}>
                                    <UnfoldMoreIcon />
                                  </span>
                                )
                              ) : (
                                // Non-sortable columns: reserve space
                                <span style={{ visibility: "hidden" }}>
                                  <UnfoldMoreIcon />
                                </span>
                              )}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody data-testid="table-body" className="table-body">
                  {table.getRowModel().rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={table.getAllColumns().length}
                        style={{ padding: "40px 0", textAlign: "center" }}
                      >
                        <span>No results were found</span>
                      </td>
                    </tr>
                  )}
                  {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr key={row.id} data-testid="row-item" className="ll-tr">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            data-testid={`cqlLibrary-button-${cell.id}`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                      {featureFlags?.LibrarySearch &&
                        selectedIdForExpansion === row.original.librarySetId &&
                        expandedSectionData?.map((subRow) => (
                          <tr
                            key={subRow.id}
                            className="expanded-row"
                            data-testid={`cqlLibrary-expanded-${subRow.id}`}
                          >
                            {/* This is lost between renders. I guess we may need to instead retain an expansion ref? */}
                            {expandedColumns.map((column: any) =>
                              column?.accessorKey === "expandArrow" ? (
                                <td></td>
                              ) : (
                                <td
                                  key={column?.accessorKey || column.id}
                                  data-testid={`cqlLibrary-button-${subRow.id}_${column.accessorKey}`}
                                >
                                  {flexRender(
                                    column.cell ?? column.accessorKey,
                                    {
                                      row: { original: subRow },
                                      getValue: () =>
                                        subRow[column.accessorKey],
                                    }
                                  )}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="pagination-container">
                <Pagination
                  totalItems={totalItems}
                  visibleItems={visibleItems}
                  limitOptions={[
                    10,
                    25,
                    50,
                    ...(totalItems > 50 && activeTab === 0 ? ["All"] : []),
                  ]}
                  offset={offset}
                  handlePageChange={handlePageChange}
                  handleLimitChange={handleLimitChange}
                  page={curPage}
                  limit={curLimit}
                  count={totalPages}
                  shape="rounded"
                  hideNextButton={!canGoNext}
                  hidePrevButton={!canGoPrev}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
