import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { act, Simulate } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import CreateNewLibraryDialog from "./CreateNewLibraryDialog";
import { Model } from "@madie/madie-models";
import { CqlLibraryServiceApi } from "../../api/useCqlLibraryServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";

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
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "TestUser@example.com", //#nosec
  }),
  useOrganizationApi: jest.fn(() => ({
    getAllOrganizations: jest.fn().mockResolvedValue(organizations),
  })),
}));
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
jest.mock("../../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "test.jwt",
}));

const mockCqlLibraryServiceApi = {
  fetchCqlLibraries: jest.fn().mockResolvedValue(cqlLibrary),
} as unknown as CqlLibraryServiceApi;

jest.mock("../../api/useCqlLibraryServiceApi", () =>
  jest.fn(() => mockCqlLibraryServiceApi)
);

const formikInfo = {
  cqlLibraryName: "",
  model: "",
  cql: "",
  publisher: "",
  description: "",
  draft: true,
};

describe("Library Dialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("An open Dialog has all the required elements", async () => {
    const onFormSubmit = jest.fn();
    const onFormCancel = jest.fn();
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

      const libraryNameNode = await getByTestId(
        "cql-library-name-text-field-input"
      );
      userEvent.type(libraryNameNode, formikInfo.cqlLibraryName);
      expect(libraryNameNode.value).toBe(formikInfo.cqlLibraryName);
      Simulate.change(libraryNameNode);

      const modelSelect = await getByTestId("cql-library-model-select");
      fireEvent.click(modelSelect);
      const modelNode = await getByTestId("cql-library-model-select-input");
      fireEvent.select(modelNode, { target: { value: formikInfo.model } });
      expect(modelNode.value).toBe(formikInfo.model);
      Simulate.change(modelNode);
    });
  });
});
