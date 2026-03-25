import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  MadieDialog,
  Pagination,
  TruncateText,
  TextField,
  ReadOnlyTextField,
  FormControlLabel,
} from "@madie/madie-design-system/dist/react";
import tw from "twin.macro";
import "styled-components/macro";
import { CqlLibrary } from "@madie/madie-models";
import { useFormik } from "formik";
import * as _ from "lodash";
import { Checkbox, Divider } from "@mui/material";
import "./TransferDialog.scss";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import * as Yup from "yup";
import { UserRoles, useUserRoles } from "@madie/madie-util";

export const INVALID_HARP_ID_MESSAGE =
  "The provided HARP ID is not associated with an active MADiE user.";

// Define the data type for rows
interface RowData {
  libraryName: string;
  model: string;
  owner?: string;
}
const TH = tw.th`p-3 text-left text-sm`;
const TD = tw.td`p-3 text-left text-sm break-keep`;

interface TransferredLibrariesProps {
  libraries: CqlLibrary[];
  isAdmin: boolean;
}

const TransferredLibraries = ({
  libraries,
  isAdmin,
}: TransferredLibrariesProps) => {
  const [visibleLibraries, setVisibleLibraries] = useState<CqlLibrary[]>([]);
  // pagination utilities
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [currentLimit, setCurrentLimit] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const managePagination = useCallback(() => {
    if (libraries.length < currentLimit) {
      setOffset(0);
      setVisibleLibraries([...libraries]);
      setVisibleItems(libraries.length);
      setTotalItems(libraries.length);
      setTotalPages(1);
    } else {
      const start = (currentPage - 1) * currentLimit;
      const end = start + currentLimit;
      const newVisibleLibraries = libraries.slice(start, end);
      setVisibleLibraries(newVisibleLibraries);
      setOffset(start);
      setVisibleItems(newVisibleLibraries.length);
      setTotalItems(libraries.length);
      setTotalPages(Math.ceil(libraries.length / currentLimit));
    }
  }, [
    currentLimit,
    currentPage,
    libraries,
    setOffset,
    setVisibleLibraries,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
  ]);

  const canGoNext = (() => {
    return currentPage < totalPages;
  })();
  const canGoPrev = currentPage > 1;

  const handlePageChange = (e, v) => {
    setCurrentPage(v);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    managePagination();
  }, [libraries, currentPage, currentLimit, managePagination]);

  // Table data
  const data: RowData[] = useMemo(
    () =>
      visibleLibraries.map((library) => ({
        libraryName: library.cqlLibraryName,
        model: library.model,
        owner: library.librarySet?.owner,
      })),
    [visibleLibraries]
  );

  // Column definitions
  const columns: ColumnDef<RowData>[] = useMemo(
    () => [
      {
        accessorKey: "libraryName",
        header: "Library",
        cell: (info) => (
          <TruncateText
            text={info.row.original.libraryName}
            maxLength={120}
            dataTestId={`library-name-${info.row.original.libraryName}`}
          />
        ),
      },
      {
        accessorKey: "model",
        header: "Model",
        cell: (info) => info.getValue(),
      },
      ...(isAdmin
        ? [
            {
              accessorKey: "owner" as const,
              header: "Current Library Owner",
              cell: (info) => info.getValue(),
            },
          ]
        : []),
    ],
    [isAdmin]
  );

  // Create the table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <table tw="min-w-full" data-testid="transfer-library-tbl">
        <thead tw="bg-slate">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TH key={header.id} scope="col">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TH>
              ))}
            </tr>
          ))}
        </thead>
        <tbody data-testId="transfer-library-tbl-body">
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className="transfer-library-row"
              data-testid={`row-${index}`}
              style={{
                borderTop: "solid 1px #8c8c8c",
                paddingTop: "32px",
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TD key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TD>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {libraries?.length > 0 && (
        <div className="pagination-container">
          <Pagination
            data-testid="trasfer-library-pagination"
            totalItems={totalItems}
            limitOptions={[5, 10, 25, 50]}
            visibleItems={visibleItems}
            offset={offset}
            handlePageChange={handlePageChange}
            handleLimitChange={handleLimitChange}
            page={currentPage}
            limit={currentLimit}
            count={totalPages}
            hideNextButton={!canGoNext}
            hidePrevButton={!canGoPrev}
            shape="rounded"
          />
        </div>
      )}
    </>
  );
};

interface TransferDialogProps {
  libraries: CqlLibrary[];
  open: boolean;
  onClose: Function;
  onSubmit: Function;
}

const TransferDialog = ({
  libraries,
  open,
  onClose,
  onSubmit,
}: TransferDialogProps) => {
  const userRoles: UserRoles = useUserRoles();
  const formik = useFormik({
    initialValues: {
      currentUser: libraries?.[0]?.librarySet?.owner,
      harpId: "",
      retainShareAccess: false,
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      harpId: Yup.string().required("New Library Owner is required."),
    }),
    onSubmit: async ({ harpId, retainShareAccess }) => {
      try {
        await onSubmit(harpId, retainShareAccess);
        formik.resetForm();
      } catch (error) {
        if (
          error?.response?.status === 400 &&
          error?.response?.data?.message === INVALID_HARP_ID_MESSAGE
        ) {
          formik.setFieldError("harpId", INVALID_HARP_ID_MESSAGE);
        }
      }
    },
  });

  return (
    <>
      <MadieDialog
        form
        title="Transfer Library Ownership"
        dialogProps={{
          onClose,
          open,
          onSubmit: formik.handleSubmit,
          maxWidth: "lg",
          "data-testid": "transfer-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "transfer-cancel-button",
        }}
        continueButtonProps={{
          variant: userRoles.isAdmin ? "cyan" : "danger-primary",
          type: "submit",
          continueText: "Transfer",
          "data-testid": "transfer-save-button",
          disabled: !formik.dirty,
        }}
      >
        <div className="transfer-dialog-info-text">
          <div>
            You are about to Transfer ownership of the {libraries?.length || 0}{" "}
            selected library(s) below. All versions and drafts will be
            transferred, but only the most recent library name appears in the
            list below.
          </div>
          {!userRoles.isAdmin && (
            <div className="warning-message">
              <ErrorOutlineIcon color="error" fontSize="small" />
              This action cannot be undone.
            </div>
          )}
        </div>
        <div data-testid="transferred-libraries-list">
          <TransferredLibraries
            libraries={libraries}
            isAdmin={userRoles.isAdmin}
          />
        </div>
        {!userRoles.isAdmin && (
          <>
            <div className="owner">Owner</div>
            <Divider sx={{ borderColor: "#8c8c8c", paddingBottom: "16px" }} />
          </>
        )}

        <div id="transfer-library">
          {!userRoles.isAdmin && (
            <div className="current-owner">
              <ReadOnlyTextField
                label="Current Library Owner"
                inputProps={{
                  "data-testid": "current-owner",
                }}
                size="large"
                {...formik.getFieldProps("currentUser")}
              />
            </div>
          )}
          <div>
            <TextField
              label="New Library Owner"
              id="harp-id-input"
              required={true}
              inputProps={{
                "data-testid": "harp-id-input",
              }}
              error={formik.touched.harpId && Boolean(formik.errors.harpId)}
              helperText={formik.touched.harpId && formik.errors.harpId}
              {...formik.getFieldProps("harpId")}
            />
          </div>
          <div className="retainShareAccess">
            <FormControlLabel
              control={
                <Checkbox
                  {...formik.getFieldProps("retainShareAccess")}
                  checked={formik.values.retainShareAccess}
                  name="retainShareAccess"
                  id="retainShareAccess"
                  data-testid="retainShareAccess"
                />
              }
              label="Retain Share Access after Transfer"
            />
          </div>
        </div>
      </MadieDialog>
    </>
  );
};
export default TransferDialog;
