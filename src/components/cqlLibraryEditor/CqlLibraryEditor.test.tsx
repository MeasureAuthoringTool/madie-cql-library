import { render, screen } from "@testing-library/react";
import * as React from "react";
import CqlLibraryEditor, {
  mapElmErrorsToAceAnnotations,
} from "./CqlLibraryEditor";

import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { CqlLibrary } from "@madie/madie-models";
import axios from "axios";
import { FHIRValueSet } from "../../api/useTerminologyServiceApi";
import { validateContent } from "@madie/madie-editor";
import {
  ElmTranslationError,
  ElmTranslation,
  ElmTranslationLibrary,
} from "./editorUtil";

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

const elmTransaltionLibraryWithValueSets: ElmTranslationLibrary = {
  valueSets: {
    def: [
      {
        localId: "test1",
        locator: "25:1-25:97",
        id: "http://test.com/ValueSet/2.16.840.1.113762.1.4.1",
      },
      {
        localId: "test2",
        locator: "26:1-26:81",
        id: "http://test.com/ValueSet/2.16.840.1.114222.4.11.836",
      },
    ],
  },
};

const fhirValueset: FHIRValueSet = {
  resourceType: "ValueSet",
  id: "testId",
  url: "testUrl",
  status: "testStatus",
  errorMsg: "error",
};

const elmTranslationWithValueSetAndTranslationErrors: ElmTranslation = {
  externalErrors: [],
  errorExceptions: translationErrors,
  library: elmTransaltionLibraryWithValueSets,
};

const elmTranslationWithValueSets: ElmTranslation = {
  externalErrors: [],
  errorExceptions: [],
  library: elmTransaltionLibraryWithValueSets,
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
  terminologyService: {
    baseUrl: "terminology.com",
  },
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// jest.mock("../../hooks/useOktaTokens", () =>
//   jest.fn(() => ({
//     getAccessToken: () => "test.jwt",
//   }))
// );
jest.mock("@madie/madie-util", () => ({
  validateContent: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
}));

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

const renderEditorForValueSets = (cqlLibrary: CqlLibrary) => {
  const props = {
    displayAnnotations: true,
    setDisplayAnnotations: jest.fn(),
    setElmTranslationError: jest.fn(),
    setSuccessMessage: jest.fn(),
    setCqlErrors: jest.fn(),
    setHandleClick: jest.fn(),
    value: cqlLibrary.cql,
    onChange: jest.fn(),
    handleClick: true,
    parseErrors: true,
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
      }
      // else if (
      //   args &&
      //   args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      // ) {
      //   return Promise.resolve({
      //     data: { json: JSON.stringify(elmTranslationWithErrors) },
      //     status: 200,
      //   });
      // }
      // return Promise.resolve(args);
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

describe("Validate value sets", () => {
  // it("Valid value sets", async () => {
  //   mockedAxios.put.mockImplementation((args) => {
  //     if (args && args.startsWith(serviceConfig.cqlLibraryService.baseUrl)) {
  //       return Promise.resolve({ data: cqlLibrary });
  //     } else if (
  //       args &&
  //       args.startsWith(serviceConfig.elmTranslationService.baseUrl)
  //     ) {
  //       return Promise.resolve({
  //         data: { json: JSON.stringify(elmTranslationWithValueSets) },
  //         status: 200,
  //       });
  //     }
  //     return Promise.resolve(args);
  //   });

  //   mockedAxios.get.mockImplementation((args) => {
  //     return Promise.resolve({
  //       data: { json: JSON.stringify(fhirValueset) },
  //       status: 200,
  //     });
  //   });

  //   renderEditorForValueSets(cqlLibrary);

  //   const valueSetValidation = await screen.findByText("Value Set is valid!");
  //   expect(valueSetValidation).toBeInTheDocument();
  //   const valueSetSuccess = await screen.findByTestId("valueset-success");
  //   expect(valueSetSuccess).toBeInTheDocument();
  // });

  // it("value sets error when not logged in to UMLS", async () => {
  //   mockedAxios.put.mockImplementation((args) => {
  //     if (args && args.startsWith(serviceConfig.cqlLibraryService.baseUrl)) {
  //       return Promise.resolve({ data: cqlLibrary });
  //     } else if (
  //       args &&
  //       args.startsWith(serviceConfig.elmTranslationService.baseUrl)
  //     ) {
  //       return Promise.resolve({
  //         data: {
  //           json: JSON.stringify(
  //             elmTranslationWithValueSetAndTranslationErrors
  //           ),
  //         },
  //         status: 200,
  //       });
  //     }
  //     return Promise.resolve(args);
  //   });

  //   mockedAxios.get.mockImplementation((args) => {
  //     return Promise.reject({
  //       data: null,
  //       status: 404,
  //     });
  //   });

  //   renderEditorForValueSets(cqlLibrary);

  //   const issues = await screen.findByText("2 issues found with CQL");
  //   expect(issues).toBeInTheDocument();
  //   const valueSetError = await screen.findByTestId("valueset-error");
  //   expect(valueSetError).toBeInTheDocument();
  //   const loginError = await screen.findByText("Please log in to UMLS!");
  //   expect(loginError).toBeInTheDocument();
  // });

  // it("Validate Value Set error with no TGT", async () => {
  //   mockedAxios.put.mockImplementation((args) => {
  //     if (args && args.startsWith(serviceConfig.cqlLibraryService.baseUrl)) {
  //       return Promise.resolve({ data: cqlLibrary });
  //     } else if (
  //       args &&
  //       args.startsWith(serviceConfig.elmTranslationService.baseUrl)
  //     ) {
  //       return Promise.resolve({
  //         data: {
  //           json: JSON.stringify(
  //             elmTranslationWithValueSetAndTranslationErrors
  //           ),
  //         },
  //         status: 200,
  //       });
  //     }
  //     return Promise.resolve(args);
  //   });

  //   renderEditorForValueSets(cqlLibrary);

  //   const issues = await screen.findByText("Please log in to UMLS!");
  //   expect(issues).toBeInTheDocument();
  // });

  // it("Invalid value sets", async () => {
  //   mockedAxios.put.mockImplementation((args) => {
  //     if (args && args.startsWith(serviceConfig.cqlLibraryService.baseUrl)) {
  //       return Promise.resolve({ data: cqlLibrary });
  //     } else if (
  //       args &&
  //       args.startsWith(serviceConfig.elmTranslationService.baseUrl)
  //     ) {
  //       return Promise.resolve({
  //         data: { json: JSON.stringify(elmTranslationWithValueSets) },
  //         status: 200,
  //       });
  //     }
  //     return Promise.resolve(args);
  //   });

  //   mockedAxios.get.mockImplementation((args) => {
  //     if (
  //       args.startsWith(serviceConfig.terminologyService.baseUrl) &&
  //       args.endsWith("umls-credentials/status")
  //     ) {
  //       return Promise.resolve({
  //         data: true,
  //         status: 200,
  //       });
  //     } else if (
  //       args.startsWith(serviceConfig.terminologyService.baseUrl) &&
  //       args.endsWith("valueset")
  //     ) {
  //       return Promise.reject({
  //         data: "failure",
  //         status: 404,
  //         error: { message: "not found" },
  //       });
  //     }
  //   });

  //   renderEditorForValueSets(cqlLibrary);

  //   const valueSetValidation = await screen.findByText(
  //     "2 issues found with CQL"
  //   );
  //   expect(valueSetValidation).toBeInTheDocument();
  //   const valueSetSuccess = await screen.findByTestId("valueset-error");
  //   expect(valueSetSuccess).toBeInTheDocument();
  // });

  it("should display errors if not logged into umls", async () => {
    const elmTransaltionErrorsUMLS: ElmTranslationError[] = [
      {
        startLine: 24,
        startChar: 7,
        endLine: 24,
        endChar: 15,
        errorSeverity: "Warning",
        errorType: "ELM",
        message: "Please log in to UMLS",
        targetIncludeLibraryId: "TestLibrary_QICore",
        targetIncludeLibraryVersionId: "5.0.000",
        type: "VSAC",
      },
    ];

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve(elmTransaltionErrorsUMLS);
    });

    renderEditor(cqlLibrary);
    const issues = await screen.findByText("1 issues found with CQL");
    expect(issues).toBeInTheDocument();
    const loggedIn = await screen.findByText("Please log in to UMLS!");
    expect(loggedIn).toBeInTheDocument();
  });
});
