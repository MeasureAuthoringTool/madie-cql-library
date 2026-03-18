import React, { useMemo, useRef, useState } from "react";
import { MadieDialog, Pagination } from "@madie/madie-design-system/dist/react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import tw from "twin.macro";
import "styled-components/macro";
import "./CqlLibraryHistoryDialog.scss";
import moment from "moment";
import Chip from "@mui/material/Chip";
import { AuditRow } from "@madie/madie-util";

const CqlLibrayHistoryDialog = (props) => {
  const { selectedCqlLibrary, open, onClose, libraryHistoryLogs } = props;
  type MadieLocalStatePage = {
    totalPages: number;
    totalItems: number;
    offset: number;
    limit: number;
    currentPage: number;
    visibleItems: AuditRow[];
  };
  const getCurrentSlice = (page, limit, allItems) => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return allItems.slice(start, end);
  };
  const getTotalPages = (numberOfItems, limit) => {
    return Math.ceil(numberOfItems / limit);
  };
  // simplify pagination.
  const [page, setPage] = useState<MadieLocalStatePage>(
    libraryHistoryLogs.length < 10
      ? {
          totalPages: 1,
          totalItems: libraryHistoryLogs.length,
          offset: 0,
          limit: 10,
          currentPage: 1,
          visibleItems: libraryHistoryLogs,
        }
      : {
          totalPages: Math.ceil(libraryHistoryLogs.length / 10),
          totalItems: libraryHistoryLogs.length,
          offset: 0,
          limit: 10,
          currentPage: 1,
          visibleItems: getCurrentSlice(1, 10, libraryHistoryLogs),
        }
  );
  const { totalPages, totalItems, offset, limit, currentPage, visibleItems } =
    page;

  const canGoNext = (() => {
    return currentPage < totalPages;
  })();
  const canGoPrev = currentPage > 1;

  const handlePageChange = (e, v) => {
    setPage({
      ...page,
      currentPage: v,
      visibleItems: getCurrentSlice(v, limit, libraryHistoryLogs),
    });
  };
  const handleLimitChange = (e) => {
    setPage({
      ...page,
      currentPage: 1,
      limit: e.target.value,
      visibleItems: getCurrentSlice(1, e.target.value, libraryHistoryLogs),
      totalPages: getTotalPages(libraryHistoryLogs.length, e.target.value),
    });
  };

  const columns = useMemo<ColumnDef<AuditRow>[]>(() => {
    const columnDefs: ColumnDef<AuditRow>[] = [
      {
        header: "Date",
        accessorKey: "performedAt",
        cell: (info) => {
          return moment(info.getValue())
            .local()
            .format("MM/DD/YYYY hh:mm:ss A");
        },
      },
      {
        header: "User Action",
        accessorKey: "actionType",
      },
      {
        header: "HarpID",
        accessorKey: "performedBy",
      },
      {
        header: "Additional Info",
        accessorKey: "additionalActionMessage",
        cell: (info) => {
          const value = info.getValue();
          return value && value != "[]" ? value : "-";
        },
      },
    ];

    return columnDefs;
  }, [libraryHistoryLogs]);

  const table = useReactTable({
    data: visibleItems,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <MadieDialog
      form
      title="Library History"
      dialogProps={{
        onClose,
        open,
        maxWidth: "lg",
        "data-testid": "share-dialog",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Close",
        "data-testid": "measure-history-close-button",
      }}
      continueButtonProps={null}
      maxWidth={"lg"}
    >
      <div id="cql-library-history-dialog">
        <div className="header-info">
          <span>{selectedCqlLibrary.cqlLibraryName} </span>
          <span>{`(Version ${selectedCqlLibrary.version})`}</span>
          {selectedCqlLibrary.draft && (
            <Chip
              data-testid="library-history-draft-chip"
              label="Draft"
              sx={{
                backgroundColor: "#e1f3f8",
                height: "24px",
                ml: 1,
              }}
            />
          )}
        </div>

        <table
          tw="min-w-full"
          id="library-history-table"
          data-testid="library-history-table"
          className="madie-table"
        >
          <thead className="madie-th">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      onClick={header.column.getToggleSortingHandler()}
                      className="header-cell"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none header-button"
                              : "header-button"
                          }
                          title={
                            header.column.getCanSort()
                              ? header.column.getNextSortingOrder() === "asc"
                                ? "Sort ascending"
                                : header.column.getNextSortingOrder() === "desc"
                                ? "Sort descending"
                                : "Clear sort"
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            className="tbody"
            data-testid="library-history-table-body"
            style={{ padding: 20 }}
          >
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="madie-tr"
                data-testid={`test-case-row-${row.id}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} data-testid={`library-history-${cell.id}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination-container">
        <Pagination
          data-testid="trasfer-library-pagination"
          totalItems={totalItems}
          limitOptions={[5, 10, 25, 50]}
          visibleItems={visibleItems.length}
          offset={offset}
          page={currentPage}
          limit={limit}
          count={totalPages}
          handleLimitChange={handleLimitChange}
          handlePageChange={handlePageChange}
          hideNextButton={!canGoNext}
          hidePrevButton={!canGoPrev}
          shape="rounded"
        />
      </div>
    </MadieDialog>
  );
};

export default CqlLibrayHistoryDialog;
