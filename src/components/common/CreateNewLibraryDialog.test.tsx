import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import {
  render,
  fireEvent,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { act, Simulate } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import CreateNewLibraryDialog from "./CreateNewLibraryDialog";
import { Model } from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { useFeatureFlags, CqlLibraryServiceApi } from "@madie/madie-util";

const { getByTestId, findByTestId } = screen;
const cqlLibrary = [
  {
    id: "622e1f46d1fd3729d861e6cb",
    cqlLibraryName: "TestCqlLibrary1",
    model: Model.QICORE,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
  },
];

const organizations = [
  {
    id: "1234",
    name: "Org1",
    oid: "1.2.3.4",
  },
  {
    id: "56789",
    name: "Org2",
    oid: "5.6.7.8",
  },
];
const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "madie.com",
  },
  elmTranslationService: {
    baseUrl: "elm-translator.com",
  },
  cqlLibraryService: {
    baseUrl: "cql-library.com",
  },
  terminologyService: {
    baseUrl: "terminology.com",
  },
};

const mockCqlLibraryServiceApi = {
  fetchCqlLibraries: jest.fn().mockResolvedValue(cqlLibrary),
  createCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary),
} as unknown as CqlLibraryServiceApi;

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  useOrganizationApi: jest.fn(() => ({
    getAllOrganizations: jest.fn().mockResolvedValue(organizations),
  })),
  useFeatureFlags: jest.fn(() => {
    return {
      qiCore6: false,
      qiCore7: false,
    };
  }),
  useCqlLibraryServiceApi: jest.fn(() => mockCqlLibraryServiceApi),
}));

const formikInfo = {
  cqlLibraryName: "",
  model: "",
  cql: "",
  publisher: "",
  description: "",
  draft: true,
};

const onFormSubmit = jest.fn();
const onFormCancel = jest.fn();
const usQualityCoreModel = Model.US_QUALITY_0_5_0;

describe("Library Dialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("An open Dialog has all the required elements", async () => {
    await act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <div>
            <button data-testId="open-button" onClick={onFormSubmit}>
              I open the dialog
            </button>
            <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
          </div>
        </ApiContextProvider>
      );

      expect(await findByTestId("dialog-form")).toBeInTheDocument();
      expect(
        await findByTestId("cql-library-name-text-field")
      ).toBeInTheDocument();

      expect(
        await findByTestId("cql-library-name-text-field-input")
      ).toBeInTheDocument();

      expect(
        await findByTestId("cql-library-model-select")
      ).toBeInTheDocument();

      expect(
        await findByTestId("cql-library-model-select-input")
      ).toBeInTheDocument();

      expect(await findByTestId("cql-library-description")).toBeInTheDocument();

      expect(await findByTestId("publisher")).toBeInTheDocument();

      expect(await findByTestId("continue-button")).toBeInTheDocument();

      const cancelButton = await findByTestId("cql-library-cancel-button");

      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeEnabled();

      const submitButton = await findByTestId("continue-button");
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      const libraryNameNode = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
      userEvent.type(libraryNameNode, formikInfo.cqlLibraryName);
      expect(libraryNameNode.value).toBe(formikInfo.cqlLibraryName);
      Simulate.change(libraryNameNode);

      const modelSelect = getByTestId("cql-library-model-select");
      fireEvent.click(modelSelect);
      const modelNode = getByTestId(
        "cql-library-model-select-input"
      ) as HTMLInputElement;
      fireEvent.select(modelNode, { target: { value: formikInfo.model } });
      expect(modelNode.value).toBe(formikInfo.model);
      Simulate.change(modelNode);
    });
  });

  test("Allows creation of a QDM library", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const cancelButton = await findByTestId("cql-library-cancel-button");

    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();

    const submitButton = await findByTestId("continue-button");
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    const libraryName = screen.getByRole("textbox", {
      name: "Library Name",
    }) as HTMLInputElement;
    userEvent.type(libraryName, "QdmLibrary_1");
    await waitFor(() => expect(libraryName.value).toEqual("QdmLibrary_1"));

    const libraryDescription = screen.getByRole("textbox", {
      name: "Description",
    }) as HTMLInputElement;
    userEvent.type(libraryDescription, "QDM Library Description");
    await waitFor(() =>
      expect(libraryDescription.value).toEqual("QDM Library Description")
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(5);
    userEvent.click(screen.getByRole("option", { name: Model.QDM_5_6 }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual("QDM v5.6");

    const publisherSelect = screen.getByRole("combobox", { name: "Publisher" });
    userEvent.click(publisherSelect);
    const publisherListbox = screen.getByRole("listbox", { name: "Publisher" });
    const publisherOptions = await within(publisherListbox).findAllByRole(
      "option"
    );
    expect(publisherOptions.length).toEqual(2);
    userEvent.click(publisherOptions[1]);
    await waitFor(() => expect(publisherSelect).toHaveValue("Org2"));

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    userEvent.click(submitButton);
    expect(
      await screen.findByText("Cql Library successfully created")
    ).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.createCqlLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        cqlLibraryName: "QdmLibrary_1",
        model: "QDM v5.6",
        cql: "",
        draft: true,
        description: "QDM Library Description",
        publisher: "Org2",
      })
    );
  }, 20000);

  test("Does not allow creation of a QI-Core library with special charater", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const cancelButton = await findByTestId("cql-library-cancel-button");

    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();

    const submitButton = await findByTestId("continue-button");
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    const libraryName = screen.getByRole("textbox", {
      name: "Library Name",
    }) as HTMLInputElement;
    userEvent.type(libraryName, "QdmLibrary_1");
    await waitFor(() => expect(libraryName.value).toEqual("QdmLibrary_1"));

    const libraryDescription = screen.getByRole("textbox", {
      name: "Description",
    }) as HTMLInputElement;
    userEvent.type(libraryDescription, "QDM Library Description");
    await waitFor(() =>
      expect(libraryDescription.value).toEqual("QDM Library Description")
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(5);
    userEvent.click(screen.getByRole("option", { name: Model.QICORE_6_0_0 }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual(Model.QICORE_6_0_0);

    const publisherSelect = screen.getByRole("combobox", { name: "Publisher" });
    userEvent.click(publisherSelect);
    const publisherListbox = screen.getByRole("listbox", { name: "Publisher" });
    const publisherOptions = await within(publisherListbox).findAllByRole(
      "option"
    );
    expect(publisherOptions.length).toEqual(2);
    userEvent.click(publisherOptions[1]);
    await waitFor(() => expect(publisherSelect).toHaveValue("Org2"));

    await waitFor(() => expect(submitButton).toBeDisabled());
  }, 20000);

  test("QI-Core 6 is enabled", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => {
      return {
        qiCore6: true,
        qiCore7: false,
      };
    });
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(5);
    userEvent.click(screen.getByRole("option", { name: Model.QICORE_6_0_0 }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual("QI-Core v6.0.0");
  }, 20000);

  test("QI-Core 7 is enabled", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => {
      return {
        qiCore7: true,
      };
    });
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(6);
    userEvent.click(screen.getByRole("option", { name: Model.QICORE_7_0_2 }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual("QI-Core v7.0.2");
  }, 20000);

  test("QI-Core 7 is not enabled", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => {
      return {
        qiCore7: false,
      };
    });
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(5);
    userEvent.click(screen.getByRole("option", { name: Model.QICORE_6_0_0 }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual("QI-Core v6.0.0");
  }, 20000);

  test("US Quality Core can be selected", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => {
      return {
        qiCore7: false,
      };
    });
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(5);
    expect(
      screen.getByTestId("cql-library-model-option-US Core v6.1.0-derived")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("cql-library-model-option-US Core v6.1.0")
    ).not.toBeInTheDocument();
    userEvent.click(screen.getByRole("option", { name: usQualityCoreModel }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual(usQualityCoreModel);
  }, 20000);

  test("Creation of a QDM library fails", async () => {
    (
      mockCqlLibraryServiceApi.createCqlLibrary as jest.Mock
    ).mockRejectedValueOnce(new Error("Failed to create CQL Library"));
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const cancelButton = await findByTestId("cql-library-cancel-button");

    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();

    const submitButton = await findByTestId("continue-button");
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    const libraryName = screen.getByRole("textbox", {
      name: "Library Name",
    }) as HTMLInputElement;
    userEvent.type(libraryName, "QdmLibrary_1");
    await waitFor(() => expect(libraryName.value).toEqual("QdmLibrary_1"));

    const libraryDescription = screen.getByRole("textbox", {
      name: "Description",
    }) as HTMLInputElement;
    userEvent.type(libraryDescription, "QDM Library Description");
    await waitFor(() =>
      expect(libraryDescription.value).toEqual("QDM Library Description")
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(5);
    userEvent.click(screen.getByRole("option", { name: Model.QDM_5_6 }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual("QDM v5.6");

    const publisherSelect = screen.getByRole("combobox", { name: "Publisher" });
    userEvent.click(publisherSelect);
    const publisherListbox = screen.getByRole("listbox", { name: "Publisher" });
    const publisherOptions = await within(publisherListbox).findAllByRole(
      "option"
    );
    expect(publisherOptions.length).toEqual(2);
    userEvent.click(publisherOptions[1]);
    await waitFor(() => expect(publisherSelect).toHaveValue("Org2"));

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    userEvent.click(submitButton);
    expect(
      await screen.findByText(
        "An error occurred while creating the CQL Library"
      )
    ).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.createCqlLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        cqlLibraryName: "QdmLibrary_1",
        model: "QDM v5.6",
        cql: "",
        draft: true,
        description: "QDM Library Description",
        publisher: "Org2",
      })
    );
  }, 20000);

  test("Creation of a QDM library fails with validation error", async () => {
    (
      mockCqlLibraryServiceApi.createCqlLibrary as jest.Mock
    ).mockRejectedValueOnce({
      response: {
        data: {
          message: "Validation error",
          validationErrors: ["Library Name is required"],
        },
      },
    });
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const cancelButton = await findByTestId("cql-library-cancel-button");

    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();

    const submitButton = await findByTestId("continue-button");
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    const libraryName = screen.getByRole("textbox", {
      name: "Library Name",
    }) as HTMLInputElement;
    userEvent.type(libraryName, "QdmLibrary_1");
    await waitFor(() => expect(libraryName.value).toEqual("QdmLibrary_1"));

    const libraryDescription = screen.getByRole("textbox", {
      name: "Description",
    }) as HTMLInputElement;
    userEvent.type(libraryDescription, "QDM Library Description");
    await waitFor(() =>
      expect(libraryDescription.value).toEqual("QDM Library Description")
    );

    const modelSelect = getByTestId("cql-library-model-select");
    const modelSelectComboBox = within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(5);
    userEvent.click(screen.getByRole("option", { name: Model.QDM_5_6 }));
    expect(
      (
        within(modelSelect).getByRole("textbox", {
          hidden: true,
        }) as HTMLInputElement
      ).value
    ).toEqual("QDM v5.6");

    const publisherSelect = screen.getByRole("combobox", { name: "Publisher" });
    userEvent.click(publisherSelect);
    const publisherListbox = screen.getByRole("listbox", { name: "Publisher" });
    const publisherOptions = await within(publisherListbox).findAllByRole(
      "option"
    );
    expect(publisherOptions.length).toEqual(2);
    userEvent.click(publisherOptions[1]);
    await waitFor(() => expect(publisherSelect).toHaveValue("Org2"));

    await waitFor(() => expect(submitButton).not.toBeDisabled());
    userEvent.click(submitButton);
    expect(
      await screen.findByText("Validation error 0 : Library Name is required")
    ).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.createCqlLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        cqlLibraryName: "QdmLibrary_1",
        model: "QDM v5.6",
        cql: "",
        draft: true,
        description: "QDM Library Description",
        publisher: "Org2",
      })
    );
  }, 20000);

  test("Cancel create QDM library", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <div>
          <button data-testId="open-button" onClick={onFormSubmit}>
            I open the dialog
          </button>
          <CreateNewLibraryDialog open={true} onClose={onFormCancel} />
        </div>
      </ApiContextProvider>
    );

    const cancelButton = await findByTestId("cql-library-cancel-button");

    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
    userEvent.click(cancelButton);
    expect(onFormCancel).toHaveBeenCalled();
    expect(mockCqlLibraryServiceApi.createCqlLibrary).not.toHaveBeenCalled();
  }, 20000);
});
