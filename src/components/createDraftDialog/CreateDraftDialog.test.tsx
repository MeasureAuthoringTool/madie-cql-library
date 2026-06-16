import * as React from "react";
import { CqlLibrary, Model } from "@madie/madie-models";
import CreateDraftDialog from "./CreateDraftDialog";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import clearAllMocks = jest.clearAllMocks;
import { useFeatureFlags } from "@madie/madie-util";

const cqlLibrary: CqlLibrary = {
  cqlErrors: false,
  librarySetId: "37ff3c16-8304-4fe5-8fa9-a6f3b468d00f",
  id: "622e1f46d1fd3729d861e6cb",
  cqlLibraryName: "TestLib",
  model: Model.QICORE,
  createdAt: "2025-05-01T18:36:51.489Z",
  createdBy: "te$t.user",
  lastModifiedAt: "2025-05-01T18:36:51.489Z",
  lastModifiedBy: "te$t.user",
  draft: true,
  version: "0.0.000",
  cql: "library TestLib version '0.0.000'\nusing QICore version '4.1.1'\n",
  active: true,
};

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({
    qiCore6: true,
    qiCore7: true,
  }),
}));

describe("Create Draft Dialog component", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("should render Draft dialog with cql library name", () => {
    render(
      <CreateDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "CQL Library Name" })
    ).toHaveValue(cqlLibrary.cqlLibraryName);
  });

  it("should generate field level error for required Cql Library name", async () => {
    render(
      <CreateDraftDialog
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

  it("should display a model version option for QI-Core measures", async () => {
    render(
      <CreateDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryName = (await screen.findByRole("textbox", {
      name: "CQL Library Name",
    })) as HTMLInputElement;
    expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();
    expect(await screen.findByText("Update Model Version")).toBeInTheDocument();
    expect(await screen.findByText("QI-Core v4.1.1")).toBeInTheDocument();

    expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
  });

  it("should not display a model version option for QDM measures", async () => {
    const qdmLibrary = Object.assign({}, cqlLibrary);
    qdmLibrary.model = Model.QDM_5_6;
    render(
      <CreateDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        cqlLibrary={qdmLibrary}
      />
    );
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();
    const cqlLibraryName = (await screen.findByRole("textbox", {
      name: "CQL Library Name",
    })) as HTMLInputElement;
    expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
    expect(screen.queryByText("Update Model Version")).not.toBeInTheDocument();

    expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
  });

  it("should generate field level error for at least one alphabet in cql library name", async () => {
    render(
      <CreateDraftDialog
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
      <CreateDraftDialog
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
      <CreateDraftDialog
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
      <CreateDraftDialog
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

  it("should navigate to cql library home page on cancel", async () => {
    const onCloseFn = jest.fn();
    render(
      <CreateDraftDialog
        open={true}
        onClose={onCloseFn}
        onSubmit={jest.fn()}
        cqlLibrary={cqlLibrary}
      />
    );
    userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should not change cql but continue drafting by calling onSubmit when user does not rename library", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreateDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
        cqlLibrary={cqlLibrary}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    }) as HTMLInputElement;
    expect(cqlLibraryNameInput.value).toBe(cqlLibrary.cqlLibraryName);
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(onSubmitFn).toHaveBeenCalledWith(cqlLibrary, cqlLibrary.model);
    });
  });

  it("should update the cql and continue drafting by calling onSubmit when user renames the library", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreateDraftDialog
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
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(onSubmitFn).toHaveBeenCalledWith(
        {
          ...cqlLibrary,
          cqlLibraryName: "TestingLibraryName12",
        },
        "QI-Core v4.1.1"
      );
    });
  });
  it("should not update cql even if user renames library when there is no cql", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreateDraftDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
        cqlLibrary={{ ...cqlLibrary, cql: null }}
      />
    );
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(onSubmitFn).toHaveBeenCalledWith(
        {
          ...cqlLibrary,
          cqlLibraryName: "TestingLibraryName12",
          cql: null,
        },
        "QI-Core v4.1.1"
      );
    });
  });

  describe("Test model version options when feature flag qicore7 is true", () => {
    it("should display all model version options for QI-Core", async () => {
      cqlLibrary.model = Model.QICORE;
      render(
        <CreateDraftDialog
          open={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          cqlLibrary={cqlLibrary}
        />
      );
      const cqlLibraryName = (await screen.findByRole("textbox", {
        name: "CQL Library Name",
      })) as HTMLInputElement;
      expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
      expect(await screen.findByText("Create Draft")).toBeInTheDocument();
      expect(
        await screen.findByText("Update Model Version")
      ).toBeInTheDocument();
      expect(await screen.findByText("QI-Core v4.1.1")).toBeInTheDocument();

      const modelSelect = screen.getByTestId("cql-library-model-select");
      const modelSelectComboBox = within(modelSelect).getByRole("combobox");
      userEvent.click(modelSelectComboBox);
      const options = await screen.findAllByRole("option");
      expect(options.length).toEqual(3);
      userEvent.click(options[0]);
      expect(
        (
          within(modelSelect).getByRole("textbox", {
            hidden: true,
          }) as HTMLInputElement
        ).value
      ).toEqual("QI-Core v4.1.1");

      await waitFor(() => {
        expect(
          screen.getByTestId("cql-library-model-option-QI-Core v4.1.1")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("cql-library-model-option-QI-Core v6.0.0")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("cql-library-model-option-QI-Core v7.0.2")
        ).toBeInTheDocument();

        expect(
          screen.queryByTestId("cql-library-model-option-QDM 5.6")
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
    });

    it("should display model version options for QI-Core v6.0.0", async () => {
      cqlLibrary.model = Model.QICORE_6_0_0;
      render(
        <CreateDraftDialog
          open={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          cqlLibrary={cqlLibrary}
        />
      );
      const cqlLibraryName = (await screen.findByRole("textbox", {
        name: "CQL Library Name",
      })) as HTMLInputElement;
      expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
      expect(await screen.findByText("Create Draft")).toBeInTheDocument();
      expect(
        await screen.findByText("Update Model Version")
      ).toBeInTheDocument();
      expect(await screen.findByText("QI-Core v6.0.0")).toBeInTheDocument();

      const modelSelect = screen.getByTestId("cql-library-model-select");
      const modelSelectComboBox = within(modelSelect).getByRole("combobox");
      userEvent.click(modelSelectComboBox);
      const options = await screen.findAllByRole("option");
      expect(options.length).toEqual(2);
      userEvent.click(options[0]);
      expect(
        (
          within(modelSelect).getByRole("textbox", {
            hidden: true,
          }) as HTMLInputElement
        ).value
      ).toEqual("QI-Core v6.0.0");

      await waitFor(() => {
        expect(
          screen.getByTestId("cql-library-model-option-QI-Core v6.0.0")
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("cql-library-model-option-QI-Core v7.0.2")
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId("cql-library-model-option-QI-Core v4.1.1")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("cql-library-model-option-QDM 5.6")
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
    });

    it("should display model version options for QI-Core v7.0.2", async () => {
      cqlLibrary.model = Model.QICORE_7_0_2;
      render(
        <CreateDraftDialog
          open={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          cqlLibrary={cqlLibrary}
        />
      );
      const cqlLibraryName = (await screen.findByRole("textbox", {
        name: "CQL Library Name",
      })) as HTMLInputElement;
      expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
      expect(await screen.findByText("Create Draft")).toBeInTheDocument();
      expect(
        await screen.findByText("Update Model Version")
      ).toBeInTheDocument();
      expect(await screen.findByText("QI-Core v7.0.2")).toBeInTheDocument();

      const modelInput = screen.getByTestId("cql-library-model-select");
      expect(modelInput).toHaveAttribute("readonly");

      expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
    });
  });

  describe("Test model version options when feature flag qicore7 is false", () => {
    beforeEach(() => {
      (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => {
        return {
          qiCore7: false,
        };
      });
    });
    it("should display all model version options for QI-Core", async () => {
      cqlLibrary.model = Model.QICORE;
      render(
        <CreateDraftDialog
          open={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          cqlLibrary={cqlLibrary}
        />
      );
      const cqlLibraryName = (await screen.findByRole("textbox", {
        name: "CQL Library Name",
      })) as HTMLInputElement;
      expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
      expect(await screen.findByText("Create Draft")).toBeInTheDocument();
      expect(
        await screen.findByText("Update Model Version")
      ).toBeInTheDocument();
      expect(await screen.findByText("QI-Core v4.1.1")).toBeInTheDocument();

      const modelSelect = screen.getByTestId("cql-library-model-select");
      const modelSelectComboBox = within(modelSelect).getByRole("combobox");
      userEvent.click(modelSelectComboBox);
      const options = await screen.findAllByRole("option");
      expect(options.length).toEqual(2);
      userEvent.click(options[0]);
      expect(
        (
          within(modelSelect).getByRole("textbox", {
            hidden: true,
          }) as HTMLInputElement
        ).value
      ).toEqual("QI-Core v4.1.1");

      await waitFor(() => {
        expect(
          screen.getByTestId("cql-library-model-option-QI-Core v6.0.0")
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId("cql-library-model-option-QI-Core v7.0.2")
        ).not.toBeInTheDocument();

        expect(
          screen.queryByTestId("cql-library-model-option-QDM 5.6")
        ).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
    });

    it("should display model version options for QI-Core v6.0.0", async () => {
      cqlLibrary.model = Model.QICORE_6_0_0;
      render(
        <CreateDraftDialog
          open={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          cqlLibrary={cqlLibrary}
        />
      );
      const cqlLibraryName = (await screen.findByRole("textbox", {
        name: "CQL Library Name",
      })) as HTMLInputElement;
      expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
      expect(await screen.findByText("Create Draft")).toBeInTheDocument();
      expect(
        await screen.findByText("Update Model Version")
      ).toBeInTheDocument();
      expect(await screen.findByText("QI-Core v6.0.0")).toBeInTheDocument();

      const modelInput = screen.getByTestId("cql-library-model-select");
      expect(modelInput).toHaveAttribute("readonly");

      expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
    });

    it("should display model version options for QI-Core v7.0.2", async () => {
      cqlLibrary.model = Model.QICORE_7_0_2;
      render(
        <CreateDraftDialog
          open={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          cqlLibrary={cqlLibrary}
        />
      );
      const cqlLibraryName = (await screen.findByRole("textbox", {
        name: "CQL Library Name",
      })) as HTMLInputElement;
      expect(cqlLibraryName.value).toEqual(cqlLibrary.cqlLibraryName);
      expect(await screen.findByText("Create Draft")).toBeInTheDocument();
      expect(
        await screen.findByText("Update Model Version")
      ).toBeInTheDocument();
      expect(await screen.findByText("QI-Core v7.0.2")).toBeInTheDocument();

      const modelInput = screen.getByTestId("cql-library-model-select");
      expect(modelInput).toHaveAttribute("readonly");

      expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
    });
  });

  describe("Test model version options when feature flag usQualityCore is true", () => {});

  describe("Test model version options when feature flag usQualityCore is false", () => {});
});
