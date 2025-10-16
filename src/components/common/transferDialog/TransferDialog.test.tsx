import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { CqlLibrary } from "@madie/madie-models";
import TransferDialog from "./TransferDialog";
import userEvent from "@testing-library/user-event";

describe("Transfer Libraries Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();
  });

  const checkDataRows = async (number: number) => {
    const tableBody = getByTestId("transfer-library-tbl-body");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(number);
    });
  };

  it("renders the dialog with the correct title and buttons", () => {
    render(
      <TransferDialog
        libraries={[]}
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(getByTestId("transfer-dialog")).toBeInTheDocument();
    expect(screen.getByText("Transfer Library Ownership")).toBeInTheDocument();
    expect(getByTestId("transfer-cancel-button")).toBeInTheDocument();
    expect(getByTestId("transfer-save-button")).toBeInTheDocument();
  });

  it("disables the transfer button when the form is untouched", () => {
    render(
      <TransferDialog
        libraries={[]}
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(getByTestId("transfer-save-button")).toBeDisabled();
  });

  it("enables the transfer button when the form is dirty", () => {
    render(
      <TransferDialog
        libraries={[]}
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    fireEvent.change(getByTestId("harp-id-input"), {
      target: { value: "newOwner" },
    });

    expect(getByTestId("transfer-save-button")).not.toBeDisabled();
  });

  it("displays validation error when new library owner is not provided", async () => {
    render(
      <TransferDialog
        libraries={[]}
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    fireEvent.blur(getByTestId("harp-id-input"));

    expect(
      await screen.findByText("New Library Owner is required.")
    ).toBeInTheDocument();
  });

  it("calls onSubmit with correct values when the form is submitted", async () => {
    const mockOnSubmit = jest.fn();
    const libraries = [{ cqlLibraryName: "Library 1", model: "Model A" }];

    render(
      <TransferDialog
        libraries={libraries as CqlLibrary[]}
        open={true}
        onClose={jest.fn()}
        onSubmit={mockOnSubmit}
      />
    );

    await checkDataRows(1);

    fireEvent.change(getByTestId("harp-id-input"), {
      target: { value: "newOwner" },
    });
    fireEvent.click(getByTestId("retainShareAccess"));
    fireEvent.click(getByTestId("transfer-save-button"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("newOwner", true);
    });
  });

  it("should handle limit change", async () => {
    const libraries = [
      { cqlLibraryName: "Library 1", model: "Model A" },
      { cqlLibraryName: "Library 2", model: "Model B" },
      { cqlLibraryName: "Library 3", model: "Model C" },
      { cqlLibraryName: "Library 4", model: "Model D" },
      { cqlLibraryName: "Library 5", model: "Model E" },
      { cqlLibraryName: "Library 6", model: "Model F" },
    ];
    render(
      <TransferDialog
        libraries={libraries as CqlLibrary[]}
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(getByTestId("transfer-library-tbl")).toBeInTheDocument();
    expect(getByTestId("library-name-Library 1-content")).toHaveTextContent(
      "Library 1"
    );
    expect(getByTestId("library-name-Library 2-content")).toHaveTextContent(
      "Library 2"
    );
    expect(getByTestId("transfer-dialog")).toBeInTheDocument();

    // change limit
    const [combobox] = await screen.findAllByText("5");
    userEvent.click(combobox);
    const pageLimit10 = screen.getByRole("option", {
      name: /10/i,
    });
    userEvent.click(pageLimit10);
    await checkDataRows(6);
  });

  it("should handle page change", async () => {
    const libraries = [
      { cqlLibraryName: "Library 1", model: "Model A" },
      { cqlLibraryName: "Library 2", model: "Model B" },
      { cqlLibraryName: "Library 3", model: "Model C" },
      { cqlLibraryName: "Library 4", model: "Model D" },
      { cqlLibraryName: "Library 5", model: "Model E" },
      { cqlLibraryName: "Library 6", model: "Model F" },
    ];
    render(
      <TransferDialog
        libraries={libraries as CqlLibrary[]}
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(getByTestId("transfer-library-tbl")).toBeInTheDocument();
    expect(getByTestId("transfer-dialog")).toBeInTheDocument();

    await checkDataRows(5);

    const page2 = await screen.findByLabelText("Go to page 2");
    userEvent.click(page2);
    // confirm there are 1 item on page
    const tableBody = getByTestId("transfer-library-tbl-body");
    await waitFor(() => {
      expect(tableBody?.querySelectorAll("tbody tr")).toHaveLength(1);
    });
  });
});
