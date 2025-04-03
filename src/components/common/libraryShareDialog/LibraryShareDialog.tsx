import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import GlobalStyles from "../../../styles/GlobalStyles";
import { Backdrop, Typography } from "@mui/material";
import {
  TextField,
  MadieDialog,
  Button,
  TruncateText,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import "./LibraryShareDialog.scss";
import * as _ from "lodash";
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
import useCqlLibraryServiceApi from "../../../api/useCqlLibraryServiceApi";
import { useFormik } from "formik";
import * as Yup from "yup";

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
const keyboardArrowStyles = {
  color: "#0073C8",
  width: 40,
  height: 40,
};

//Convert date string to format of mm/dd/yyyy with no leading zeroes in month
const convertDate = (date: string) => {
  if (!date) {
    return "";
  }
  const dateObj = new Date(date);
  const year = dateObj.getUTCFullYear().toString();
  const month = String(dateObj.getUTCMonth() + 1);
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
};

const sortSharedLibraries = (a: SharedLibrary, b: SharedLibrary) => {
  //Move SharedLibraries with dateShared of "-" to end of list
  if (a.dateShared === "-" || b.dateShared === "-") {
    return -1;
  }

  return new Date(b.dateShared).getTime() - new Date(a.dateShared).getTime();
};

const LibraryShareDialog = ({
  libraries,
  open,
  option,
  onClose,
}: ShareDialogProps) => {
  const libraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  const [sharedLibraries, setSharedLibraries] = useState<SharedLibrary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sharedWithAllSelectedLibraries, setSharedWithAllSelectedLibraries] =
    useState<boolean>(false);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [sharedLibrariesRequest, setSharedLibrariesRequest] = useState(
    new Map<string, string[]>()
  );

  const updateSharedLibraries = (LibraryId, harpId) => {
    setSharedLibrariesRequest((map) => {
      const current = map.get(LibraryId) || [];
      current.push(harpId);

      return map.set(LibraryId, current);
    });
  };

  const harpIdCheck = (isSharedWithAllSelectedLibraries: boolean) => {
    return {
      message: `The selected Libraries are already shared with this user.`,
      test: () => {
        return !isSharedWithAllSelectedLibraries;
      },
    };
  };

  const handleAddUser = () => {
    // Remove all spaces from harpId
    const harpId = formik.getFieldProps("harpId").value.replace(/\s/g, "");

    // If no harpId is passed in (string with all whitespace), only clear out the harpId field
    if (!harpId) {
      formik.setFieldValue("harpId", "");
      return;
    }

    let sharedWithAllSelectedLibraries = true;

    const updatedSharedLibraries = sharedLibraries.map((library) => {
      if (
        library.subRows.length &&
        library.subRows.some((subRow) => subRow.userId === harpId)
      ) {
        return { ...library };
      } else {
        sharedWithAllSelectedLibraries = false;

        updateSharedLibraries(library.libraryId, harpId);

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

    setSharedLibraries(updatedSharedLibraries);

    if (!sharedWithAllSelectedLibraries) {
      setSaveDisabled(false);
      formik.resetForm();
    }

    setSharedWithAllSelectedLibraries(sharedWithAllSelectedLibraries);
  };

  const handleSubmit = async () => {
    setExecuting(true);

    try {
      await libraryServiceApi.shareLibraries(sharedLibrariesRequest);

      onClose({
        type: "success",
        message: "The Libraries were successfully shared.",
      });
    } catch (error) {
      onClose({
        type: "danger",
        message: error.message,
      });
    } finally {
      setExecuting(false);
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
      const libraryMap = new Map(
        responses.map((library) => [library.id, library])
      );

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
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [open]);

  const formik = useFormik({
    initialValues: {
      harpId: "",
    },
    validationSchema: Yup.object().shape({
      harpId: Yup.string().test(harpIdCheck(sharedWithAllSelectedLibraries)),
    }),
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    getSharedLibrary();
  }, [getSharedLibrary]);

  useEffect(() => {
    formik.validateForm();
  }, [sharedWithAllSelectedLibraries]);

  useEffect(() => {
    setSaveDisabled(true);
    setSharedLibrariesRequest(new Map<string, string[]>());
    table.resetExpanded();
    formik.resetForm();
  }, [onClose]);

  const columns = useMemo<ColumnDef<SharedLibrary>[]>(() => {
    let columnDefs = [];
    if (libraries.length > 0) {
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
              <></>
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
          id: "expand-button",
        },
      ];
    }

    return columnDefs;
  }, [libraries]);

  const table = useReactTable({
    data: sharedLibraries,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows,
  });
  return (
    <>
      <GlobalStyles />
      <MadieDialog
        form
        title={option}
        dialogProps={{
          onClose,
          open,
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
          disabled: saveDisabled || !formik.isValid || executing,
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
          <div style={{ marginLeft: 32, marginRight: 32 }}>
            When sharing a library, all versions and drafts are shared, so only
            the most recent library name appears here.
          </div>
          <div className="cql-library-table no-margin-top">
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
                        {row.getVisibleCells().map((cell) => {
                          if (cell.column.id === "expand-button") {
                            return (
                              <td key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={cell.id}
                              data-testid={`${cell.id}_${cell.row.original?.libraryId}`}
                            >
                              {String(cell.getValue() ?? "")}
                            </td>
                          );
                        })}
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
          open={loading}
        >
          <MadieSpinner style={{ height: 50, width: 50 }} />
          <Typography color="inherit">Loading shared Libraries...</Typography>
        </Backdrop>
      </MadieDialog>
    </>
  );
};

export default LibraryShareDialog;
