import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CqlLibrary from "../../models/CqlLibrary";
import CqlLibraryList from "./CqlLibraryList";
import { Model } from "../../models/Model";
import userEvent from "@testing-library/user-event";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "../../api/useCqlLibraryServiceApi";

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = (path: string) => mockPush(path);
    return { push };
  },
}));

const cqlLibrary: CqlLibrary[] = [
  {
    id: "622e1f46d1fd3729d861e6cb",
    cqlLibraryName: "testing1",
    model: Model.QICORE,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    draft: true,
    version: "0.0.000",
    groupId: null,
    cql: null,
  },
];

const loadCqlLibraries = jest.fn();

// Mocking the service calls to create Draft and version
jest.mock("../../api/useCqlLibraryServiceApi");
const useCqlLibraryServiceMock =
  useCqlLibraryServiceApi as jest.Mock<CqlLibraryServiceApi>;

const useCqlLibraryServiceMockResolved = {
  createVersion: jest.fn().mockResolvedValue({}),
  createDraft: jest.fn().mockResolvedValue({}),
} as unknown as CqlLibraryServiceApi;

describe("CqlLibrary List component", () => {
  beforeEach(() => {
    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockResolved;
    });
  });

  it("should display a list of Cql Libraries", () => {
    const { getByText, getByTestId } = render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    cqlLibrary.forEach((c) => {
      expect(getByText(c.cqlLibraryName)).toBeInTheDocument();
      expect(
        screen.getByTestId(`cqlLibrary-button-${c.id}`)
      ).toBeInTheDocument();
    });

    const cqlLibraryModelButton = getByTestId(
      `cqlLibrary-button-${cqlLibrary[0].id}-model`
    );
    expect(cqlLibraryModelButton).toBeInTheDocument();
    userEvent.click(cqlLibraryModelButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      1,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit"
    );

    const cqlLibraryButton = getByTestId(
      `cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(cqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      2,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit"
    );

    const editCqlLibraryButton = getByTestId(
      `edit-cqlLibrary-${cqlLibrary[0].id}`
    );
    fireEvent.click(editCqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      3,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit"
    );
  });

  it("should display version button for draft libraries and on click should render dialog", () => {
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(versionButton);
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
  });

  it("should display draft button for version libraries and on click should render dialog", () => {
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: null,
        createdBy: null,
        lastModifiedAt: null,
        lastModifiedBy: null,
        draft: false,
        version: "0.0.000",
        groupId: null,
        cql: null,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(draftButton);
    expect(screen.getByTestId("create-draft-dialog")).toBeInTheDocument();
  });

  it("should successfully draft a cql library", async () => {
    render(
      <CqlLibraryList
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
      />
    );
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(draftButton);
    expect(screen.getByTestId("create-draft-dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByTestId(
      "cql-library-name-text-field"
    );
    fireEvent.blur(cqlLibraryNameInput);
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    fireEvent.click(screen.getByTestId("create-draft-continue-button"));
    await waitFor(() => {
      expect(loadCqlLibraries).toHaveBeenCalled();
    });
  });

  it("should display bad request error while creating a draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 400,
        },
      },
    };
    const useCqlLibraryServiceMockRejected = {
      createDraft: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
      />
    );
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(draftButton);
    expect(screen.getByTestId("create-draft-dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByTestId(
      "cql-library-name-text-field"
    );
    fireEvent.blur(cqlLibraryNameInput);
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    fireEvent.click(screen.getByTestId("create-draft-continue-button"));
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Requested Cql Library cannot be drafted"
      );
    });
  });

  it("should display unauthorized error while creating a draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 403,
        },
      },
    };
    const useCqlLibraryServiceMockRejected = {
      createDraft: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
      />
    );
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(draftButton);
    expect(screen.getByTestId("create-draft-dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByTestId(
      "cql-library-name-text-field"
    );
    fireEvent.blur(cqlLibraryNameInput);
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    fireEvent.click(screen.getByTestId("create-draft-continue-button"));
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "User is unauthorized to create a draft"
      );
    });
  });

  it("should display server error while creating a draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 500,
          message: "Internal server error",
        },
      },
    };
    const useCqlLibraryServiceMockRejected = {
      createDraft: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
      />
    );
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(draftButton);
    expect(screen.getByTestId("create-draft-dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByTestId(
      "cql-library-name-text-field"
    );
    fireEvent.blur(cqlLibraryNameInput);
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    fireEvent.click(screen.getByTestId("create-draft-continue-button"));
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Internal server error"
      );
    });
  });

  it("should display unique library name error for changing to already used name during draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 400,
          message: "Library name must be unique.",
        },
      },
    };
    const useCqlLibraryServiceMockRejected = {
      createDraft: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
      />
    );
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(draftButton);
    expect(screen.getByTestId("create-draft-dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByTestId(
      "cql-library-name-text-field"
    );
    fireEvent.blur(cqlLibraryNameInput);
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "ExistingLibraryName");
    fireEvent.click(screen.getByTestId("create-draft-continue-button"));
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Requested Cql Library cannot be drafted. Library name must be unique."
      );
    });
  });

  it("should successfully version a cql library", async () => {
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(versionButton);
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(loadCqlLibraries).toHaveBeenCalled();
    });
  });

  it("should display bad request error while creating a version of a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 400,
        },
      },
    };
    const useCqlLibraryServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(versionButton);
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Requested Cql Library cannot be versioned"
      );
    });
  });

  it("should display unauthorized error while creating a version of a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 403,
        },
      },
    };
    const useCqlLibraryServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(versionButton);
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "User is unauthorized to create a version"
      );
    });
  });

  it("should display server error while creating a version of a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 500,
          message: "Internal server error",
        },
      },
    };
    const useCqlLibraryServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    fireEvent.click(versionButton);
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Internal server error"
      );
    });
  });
});
