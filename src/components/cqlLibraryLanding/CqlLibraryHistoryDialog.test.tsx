import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CqlLibrayHistoryDialog, { AuditRow } from "./CqlLibraryHistoryDialog";

jest.mock("@madie/madie-design-system/dist/react", () => ({
  MadieDialog: ({ children, ...props }) => (
    <div data-testid="madie-dialog">{children}</div>
  ),
  Pagination: (props) => (
    <div data-testid="trasfer-library-pagination">
      <button
        data-testid="pagination-prev"
        disabled={props.hidePrevButton}
        onClick={() => props.handlePageChange(null, props.page - 1)}
      >
        Prev
      </button>
      <button
        data-testid="pagination-next"
        disabled={props.hideNextButton}
        onClick={() => props.handlePageChange(null, props.page + 1)}
      >
        Next
      </button>
      <select
        data-testid="pagination-limit"
        value={props.limit}
        onChange={props.handleLimitChange}
      >
        {props.limitOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  ),
}));

jest.mock("@mui/material/Chip", () => (props) => (
  <div data-testid={props["data-testid"] || "chip"}>{props.label}</div>
));

describe("CqlLibrayHistoryDialog", () => {
  const baseProps = {
    selectedCqlLibrary: {
      cqlLibraryName: "Test Library",
      version: "1.0.0",
      draft: false,
    },
    open: true,
    onClose: jest.fn(),
    libraryHistoryLogs: [
      {
        actionType: "CREATED",
        additionalActionMessage: "Initial creation",
        performedAt: "2023-01-01T12:00:00Z",
        performedBy: "user1",
      },
      {
        actionType: "UPDATED",
        additionalActionMessage: "Updated description",
        performedAt: "2023-01-02T13:00:00Z",
        performedBy: "user2",
      },
    ] as AuditRow[],
  };

  it("renders dialog with library name and version", () => {
    render(<CqlLibrayHistoryDialog {...baseProps} />);
    expect(screen.getByText("Test Library")).toBeInTheDocument();
    expect(screen.getByText("(Version 1.0.0)")).toBeInTheDocument();
    expect(screen.getByTestId("madie-dialog")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<CqlLibrayHistoryDialog {...baseProps} />);
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("User Action")).toBeInTheDocument();
    expect(screen.getByText("HarpID")).toBeInTheDocument();
    expect(screen.getByText("Additional Info")).toBeInTheDocument();
  });

  it("renders table rows with correct data", () => {
    render(<CqlLibrayHistoryDialog {...baseProps} />);
    expect(screen.getByText("CREATED")).toBeInTheDocument();
    expect(screen.getByText("UPDATED")).toBeInTheDocument();
    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
    expect(screen.getByText("Initial creation")).toBeInTheDocument();
    expect(screen.getByText("Updated description")).toBeInTheDocument();
  });

  it("renders Draft chip if draft is true", () => {
    render(
      <CqlLibrayHistoryDialog
        {...baseProps}
        selectedCqlLibrary={{ ...baseProps.selectedCqlLibrary, draft: true }}
      />
    );
    expect(
      screen.getByTestId("library-history-draft-chip")
    ).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("shows '-' for empty additionalActionMessage", () => {
    const logs = [
      {
        actionType: "CREATED",
        additionalActionMessage: "",
        performedAt: "2023-01-01T12:00:00Z",
        performedBy: "user1",
      },
      {
        actionType: "UPDATED",
        additionalActionMessage: "[]",
        performedAt: "2023-01-02T13:00:00Z",
        performedBy: "user2",
      },
    ];
    render(<CqlLibrayHistoryDialog {...baseProps} libraryHistoryLogs={logs} />);
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("renders pagination and handles page change", () => {
    const logs = Array.from({ length: 15 }, (_, i) => ({
      actionType: "ACTION",
      additionalActionMessage: `msg${i}`,
      performedAt: `2023-01-0${(i % 9) + 1}T12:00:00Z`,
      performedBy: `user${i}`,
    }));
    render(<CqlLibrayHistoryDialog {...baseProps} libraryHistoryLogs={logs} />);
    expect(
      screen.getByTestId("trasfer-library-pagination")
    ).toBeInTheDocument();
    // Should show first 10 rows
    expect(screen.getAllByTestId(/test-case-row-/).length).toBe(10);
    // Go to next page
    fireEvent.click(screen.getByTestId("pagination-next"));
    // Should show remaining 5 rows
    expect(screen.getAllByTestId(/test-case-row-/).length).toBe(5);
    // Go back to previous page
    fireEvent.click(screen.getByTestId("pagination-prev"));
    expect(screen.getAllByTestId(/test-case-row-/).length).toBe(10);
  });

  it("handles limit change", () => {
    const logs = Array.from({ length: 12 }, (_, i) => ({
      actionType: "ACTION",
      additionalActionMessage: `msg${i}`,
      performedAt: `2023-01-0${(i % 9) + 1}T12:00:00Z`,
      performedBy: `user${i}`,
    }));
    render(<CqlLibrayHistoryDialog {...baseProps} libraryHistoryLogs={logs} />);
    // Change limit to 5
    fireEvent.change(screen.getByTestId("pagination-limit"), {
      target: { value: "5" },
    });
    expect(screen.getAllByTestId(/test-case-row-/).length).toBe(5);
    // Change limit to 25 (should show all)
    fireEvent.change(screen.getByTestId("pagination-limit"), {
      target: { value: "25" },
    });
    expect(screen.getAllByTestId(/test-case-row-/).length).toBe(12);
  });
});
