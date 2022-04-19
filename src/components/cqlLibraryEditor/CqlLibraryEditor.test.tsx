import { render, screen } from "@testing-library/react";
import * as React from "react";
import CqlLibraryEditor, {
  mapElmErrorsToAceAnnotations,
} from "./CqlLibraryEditor";
import { ElmTranslation } from "../../api/useElmTranslationServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import CqlLibrary from "../../models/CqlLibrary";
import axios from "axios";

const cqlLibrary = {
  id: "",
  cqlLibraryName: "",
  cqlErrors: false,
  cql: "library testCql version '1.0.000'",
  createdAt: "",
  createdBy: "",
  lastModifiedAt: "",
  lastModifiedBy: "",
} as CqlLibrary;

const elmTranslationWithNoErrors: ElmTranslation = {
  externalErrors: [],
  errorExceptions: [],
  library: null,
};

const translationErrors = [
  {
    startLine: 4,
    startChar: 19,
    endLine: 19,
    endChar: 23,
    errorSeverity: "Error",
    errorType: null,
    message: "Test error 123",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: null,
  },
  {
    startLine: 24,
    startChar: 7,
    endLine: 24,
    endChar: 15,
    errorSeverity: "Warning",
    errorType: null,
    message: "Test Warning 456",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: null,
  },
];
const elmTranslationWithErrors: ElmTranslation = {
  externalErrors: [],
  errorExceptions: translationErrors,
  library: null,
};

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
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

export interface CqlLibraryEditorProps {
  displayAnnotations: boolean;
  setDisplayAnnotations: (val: boolean) => void;
  setElmTranslationError: (val: string) => void;
  setSuccessMessage: (val: string) => void;
  value: string;
  onChange: (val: string) => void;
  setCqlErrors: (val: boolean) => void;
  setHandleClick: (val: boolean) => void;
  handleClick: boolean;
}

const renderEditor = (cqlLibrary: CqlLibrary) => {
  const props = {
    displayAnnotations: true,
    setDisplayAnnotations: jest.fn(),
    setElmTranslationError: jest.fn(),
    setSuccessMessage: jest.fn(),
    setCqlErrors: jest.fn(),
    setHandleClick: jest.fn(),
    value: cqlLibrary.cql,
    onChange: jest.fn(),
    handleClick: undefined,
  } as CqlLibraryEditorProps;
  return render(
    <ApiContextProvider value={serviceConfig}>
      <CqlLibraryEditor {...props} />
    </ApiContextProvider>
  );
};

describe("Create New Cql Library Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("editor must be empty when rendered", async () => {
    const { getByTestId } = renderEditor(cqlLibrary);
    const editorContainer = (await getByTestId(
      "cql-library-editor"
    )) as HTMLInputElement;
    expect(cqlLibrary.cql).toEqual(editorContainer.value);
  });

  it("set the editor to empty when no cql present", async () => {
    const CqlLibraryWithNoCql = {
      id: "CQL1",
      cqlLibraryName: "CQL1",
    } as CqlLibrary;
    const { getByTestId } = renderEditor(CqlLibraryWithNoCql);
    const editorContainer = (await getByTestId(
      "cql-library-editor"
    )) as HTMLInputElement;
    expect(editorContainer.value).toEqual("");
  });

  it("runs ELM translation on initial load of component and generate annotations", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.cqlLibraryService.baseUrl)) {
        return Promise.resolve({ data: cqlLibrary });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithErrors) },
          status: 200,
        });
      }
      return Promise.resolve(args);
    });
    renderEditor(cqlLibrary);
    const issues = await screen.findByText("CQL is valid");
    expect(issues).toBeInTheDocument();
  });
});

describe("mapping Elm Errors to Ace Annotations", () => {
  it("should return an empty array for null input", () => {
    const translationErrors = null;
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for undefined input", () => {
    const translationErrors = undefined;
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for empty array input", () => {
    const translationErrors = [];
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for non-array input", () => {
    const translationErrors: any = { field: "value" };
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an array of mapped elements", () => {
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(2);
    expect(output[0]).toEqual({
      row: 3,
      column: 19,
      type: "error",
      text: `ELM: 19:23 | Test error 123`,
    });
    expect(output[1]).toEqual({
      row: 23,
      column: 7,
      type: "warning",
      text: `ELM: 7:15 | Test Warning 456`,
    });
  });
});
