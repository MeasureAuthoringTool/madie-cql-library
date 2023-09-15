import * as React from "react";
import {
  fireEvent,
  logRoles,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CqlLibrary, Model } from "@madie/madie-models";
import CqlLibraryList from "./CqlLibraryList";
import userEvent from "@testing-library/user-event";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "../../api/useCqlLibraryServiceApi";
import { checkUserCanEdit } from "@madie/madie-util";
import { AxiosError, AxiosResponse } from "axios";

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
}));

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
    librarySetId: "librarySetId1",
    cqlLibraryName: "testing1",
    model: Model.QICORE,
    createdAt: "",
    createdBy: "testuser@example.com",
    lastModifiedAt: "",
    lastModifiedBy: "",
    draft: true,
    version: "0.0.000",
    groupId: "",
    cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
    cqlErrors: false,
  },
  {
    id: "622e1f46d1fd3729d861e6c1",
    librarySetId: "librarySetId2",
    cqlLibraryName: "testing2",
    model: Model.QICORE,
    createdAt: "",
    createdBy: "anothertestuser@example.com",
    lastModifiedAt: "",
    lastModifiedBy: "null",
    draft: true,
    version: "0.0.000",
    groupId: "",
    cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
    cqlErrors: false,
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
  deleteDraft: jest.fn().mockResolvedValue({}),
} as unknown as CqlLibraryServiceApi;

describe("CqlLibrary List component", () => {
  beforeEach(() => {
    useCqlLibraryServiceMockResolved.createVersion = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.createDraft = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.deleteDraft = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockResolved;
    });
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
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
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );

    const cqlLibraryButton = getByTestId(
      `cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(cqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      2,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );

    const editCqlLibraryButton = getByTestId(
      `cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(editCqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      3,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );
  });

  it("should display version button for draft libraries and on click should render dialog", () => {
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);

    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );

    fireEvent.click(versionButton);
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
  });

  it("should display edit button and on click should render CQL library edit page", () => {
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);

    const editButton = screen.getByTestId(
      `edit-cql-library-button-${cqlLibrary[0].id}-edit`
    );
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenNthCalledWith(
      1,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );
  });

  it("should display draft button for version libraries and on click should render dialog", () => {
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "librarySetId",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: false,
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);

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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);
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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);

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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);
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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);

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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);
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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);
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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);

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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);
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
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(viewEditButton);
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

  it("should display delete draft button for owned, draft libraries and on click should render dialog", async () => {
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );

    userEvent.click(
      screen.getByRole("button", {
        name: "CQL Library testing1 version 0.0.000 draft status true View / Edit",
      })
    );
    userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(
      await screen.findByText("Delete draft of testing1?")
    ).toBeInTheDocument();
  });

  it("should delete draft library on confirmation", async () => {
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
      {
        id: "650359394b0427f896ced541",
        librarySetId: "libsetid2",
        cqlLibraryName: "versioned lib1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: false,
        version: "1.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );

    userEvent.click(
      screen.getByRole("button", {
        name: "CQL Library testing1 version 0.0.000 draft status true View / Edit",
      })
    );
    userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(
      await screen.findByText("Delete draft of testing1?")
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
    await waitFor(() => {
      expect(useCqlLibraryServiceMockResolved.deleteDraft).toBeCalled();
    });
    expect(
      await screen.findByText("The Draft CQL Library has been deleted.")
    ).toBeInTheDocument();
  });

  it("should display error message for delete draft library when backend states not a draft", async () => {
    // this scenario could possibly happen if the library document is versioned in a different window/tab
    // or by a different user (once sharing is added) but current window thinks library document is still draft
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true, // need this to be true for UI to present delete option
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );

    const axiosError: AxiosError = {
      response: {
        status: 409,
        data: {
          status: 409,
          error: "Conflict",
          message: "GOOD PERSON DO BAD THING",
        },
      } as AxiosResponse,
      toJSON: jest.fn(),
    } as unknown as AxiosError;
    useCqlLibraryServiceMockResolved.deleteDraft = jest
      .fn()
      .mockRejectedValueOnce(axiosError);

    userEvent.click(
      screen.getByRole("button", {
        name: "CQL Library testing1 version 0.0.000 draft status true View / Edit",
      })
    );
    userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(
      await screen.findByText("Delete draft of testing1?")
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
    await waitFor(() => {
      expect(useCqlLibraryServiceMockResolved.deleteDraft).toBeCalled();
    });
    expect(
      await screen.findByText(
        "This CQL Library is not in the correct state to be deleted."
      )
    ).toBeInTheDocument();
  });

  it("should display error message for delete draft library when non-owner attempts to delete", async () => {
    // this scenario could possibly happen if the library is transferred while the former owner is still on the list page
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true, // need this to be true for UI to present delete option
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );

    const axiosError: AxiosError = {
      response: {
        status: 403,
        data: {
          status: 403,
          error: "Forbidden",
          message: "BAD PERSON DO BAD THING",
        },
      } as AxiosResponse,
      toJSON: jest.fn(),
    } as unknown as AxiosError;
    useCqlLibraryServiceMockResolved.deleteDraft = jest
      .fn()
      .mockRejectedValueOnce(axiosError);

    userEvent.click(
      screen.getByRole("button", {
        name: "CQL Library testing1 version 0.0.000 draft status true View / Edit",
      })
    );
    userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(
      await screen.findByText("Delete draft of testing1?")
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
    await waitFor(() => {
      expect(useCqlLibraryServiceMockResolved.deleteDraft).toBeCalled();
    });
    expect(
      await screen.findByText(
        "User is not authorized to delete this CQL Library."
      )
    ).toBeInTheDocument();
  });

  it("should not delete draft library on cancel", async () => {
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
      {
        id: "650359394b0427f896ced541",
        librarySetId: "libsetid2",
        cqlLibraryName: "versioned lib1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: false,
        version: "1.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );

    userEvent.click(
      screen.getByRole("button", {
        name: "CQL Library testing1 version 0.0.000 draft status true View / Edit",
      })
    );
    userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(
      await screen.findByText("Delete draft of testing1?")
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(useCqlLibraryServiceMockResolved.deleteDraft).not.toBeCalled();
    });
    expect(
      await screen.queryByText("The Draft CQL Library has been deleted.")
    ).not.toBeInTheDocument();
  });

  it("should not have delete draft option if not owner", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(false);
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );

    userEvent.click(
      screen.getByRole("button", {
        name: "CQL Library testing1 version 0.0.000 draft status true View / Edit",
      })
    );
    expect(
      await screen.findByRole("button", { name: "View" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });

  it("should not have delete draft option if owner but versioned library", async () => {
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: false,
        version: "0.0.000",
        groupId: "",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
      />
    );

    userEvent.click(
      screen.getByRole("button", {
        name: "CQL Library testing1 version 0.0.000 draft status false View / Edit",
      })
    );
    expect(
      await screen.findByRole("button", { name: "View" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Draft" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" })
    ).not.toBeInTheDocument();
  });
});
