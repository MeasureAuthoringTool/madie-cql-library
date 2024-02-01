import * as React from "react";
import { CqlLibrary, Model } from "@madie/madie-models";
import CreatDraftDialog from "./CreateDraftDialog";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import clearAllMocks = jest.clearAllMocks;

const cqlLibrary: CqlLibrary = {
  cqlErrors: false,
  librarySetId: "",
  id: "622e1f46d1fd3729d861e6cb",
  cqlLibraryName: "testing1",
  model: Model.QICORE,
  createdAt: null,
  createdBy: null,
  lastModifiedAt: null,
  lastModifiedBy: null,
  draft: true,
  version: "0.0.000",
  cql: null,
};

describe("Create Draft Dialog component", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("should render Draft dialog with cql library name", () => {
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "CQL Library Name" })
    ).toHaveValue("testing1");
  });

  it("should generate field level error for required Cql Library name", async () => {
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    await waitFor(() => {
      expect(
        screen.getByTestId("cqlLibraryName-helper-text")
      ).toHaveTextContent("Library name is required.");
    });
  });

  it("should generate field level error for at least one alphabet in cql library name", async () => {
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "123123");
    await waitFor(() => {
      expect(
        screen.getByTestId("cqlLibraryName-helper-text")
      ).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for underscore in cql library name", async () => {
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "Testing_libraryName12");
    await waitFor(() => {
      expect(
        screen.getByTestId("cqlLibraryName-helper-text")
      ).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for library name starting with lower case", async () => {
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "testingLibraryName12");
    await waitFor(() => {
      expect(
        screen.getByTestId("cqlLibraryName-helper-text")
      ).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for library name with a space", async () => {
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "testing LibraryName12");
    await waitFor(() => {
      expect(
        screen.getByTestId("cqlLibraryName-helper-text")
      ).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should have continue button disabled until form is valid", async () => {
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
  });

  it("should navigate to cql library home page on cancel", async () => {
    const onCloseFn = jest.fn();
    render(
      <CreatDraftDialog
        open={true}
        onClose={onCloseFn}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should continue drafting by calling onSubmit", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreatDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(onSubmitFn).toHaveBeenCalled();
    });
  });
});
