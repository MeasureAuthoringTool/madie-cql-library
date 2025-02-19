import * as React from "react";
import {
  cleanup,
  fireEvent,
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
import {
  checkUserCanEdit,
  checkUserCanDelete,
  useFeatureFlags,
} from "@madie/madie-util";
import { AxiosError, AxiosResponse } from "axios";
import { check } from "prettier";

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  checkUserCanDelete: jest.fn(() => {
    return true;
  }),
  useFeatureFlags: jest.fn().mockReturnValue({}),
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
    createdAt: "1",
    createdBy: "testuseratexamplecom",
    lastModifiedAt: "",
    lastModifiedBy: "",
    draft: true,
    version: "0.0.000",
    cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
    cqlErrors: false,
    active: true,
  },
  {
    id: "622e1f46d1fd3729d861e6c1",
    librarySetId: "librarySetId2",
    cqlLibraryName: "testing2",
    model: Model.QICORE,
    createdAt: "",
    createdBy: "anothertestuseratexamplecom",
    lastModifiedAt: "2",
    lastModifiedBy: "null",
    draft: true,
    version: "0.0.000",
    cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
    cqlErrors: false,
    active: true,
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
  fetchCqlLibrary: jest.fn().mockResolvedValue({}),
} as unknown as CqlLibraryServiceApi;

describe("CqlLibrary List component", () => {
  beforeEach(() => {
    jest.resetModules();
    useCqlLibraryServiceMockResolved.createVersion = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.createDraft = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.deleteDraft = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.fetchCqlLibrary = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMock.mockReset().mockImplementation(() => {
      return useCqlLibraryServiceMockResolved;
    });
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
  });
  afterEach(() => {
    cleanup();
  });

  it("should display a list of Cql Libraries", () => {
    const { getByText, getByTestId } = render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
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
    userEvent.click(cqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      2,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );

    const editCqlLibraryButton = getByTestId(
      `cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(editCqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      3,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );
  });

  it("should display version button for draft libraries and on click should render dialog", async () => {
    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );

    await userEvent.click(versionButton);
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
  });

  it("should display edit button and on click should render CQL library edit page", () => {
    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    const editButton = screen.getByTestId(
      `edit-cql-library-button-${cqlLibrary[0].id}-edit`
    );
    expect(editButton).toBeInTheDocument();
    userEvent.click(editButton);

    expect(mockPush).toHaveBeenNthCalledWith(
      1,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );
  });

  it("should display draft button for version libraries and on click should render dialog", async () => {
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
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
    ];

    useCqlLibraryServiceMockResolved.fetchCqlLibrary = jest
      .fn()
      .mockResolvedValue(cqlLibrary[0]);

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockResolved;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("should successfully draft a cql library", async () => {
    useCqlLibraryServiceMockResolved.fetchCqlLibrary = jest
      .fn()
      .mockResolvedValue(cqlLibrary[0]);

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockResolved;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={{ ...cqlLibrary[0], draft: false }}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
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
      fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={{ ...cqlLibrary[0], draft: false }}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
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
      fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={{ ...cqlLibrary[0], draft: false }}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
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
      fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={{ ...cqlLibrary[0], draft: false }}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
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
      fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[{ ...cqlLibrary[0], draft: false }]}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={{ ...cqlLibrary[0], draft: false }}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);
    const draftButton = screen.getByTestId(
      `create-new-draft-${cqlLibrary[0].id}-button`
    );
    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "ExistingLibraryName");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Requested Cql Library cannot be drafted. Library name must be unique."
      );
    });
  });

  it.skip("should successfully version a cql library", async () => {
    //idk why it's saying there's no cql, this is changing in an upcoming ticket anyway hopefully it works then
    //oh no I'm working on that ticket
    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    await waitFor(() => {
      expect(
        screen.getByTestId(`create-new-version-${cqlLibrary[0].id}-button`)
      ).toBeInTheDocument();
    });
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    userEvent.click(versionButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    const majorButton = screen.getByLabelText("Major");
    userEvent.click(majorButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("create-version-continue-button")
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByTestId("create-version-continue-button");
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "New version of CQL Library is Successfully created"
      );
    });
    await waitFor(() => {
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
      fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    await waitFor(() => {
      expect(
        screen.getByTestId(`create-new-version-${cqlLibrary[0].id}-button`)
      ).toBeInTheDocument();
    });
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    userEvent.click(versionButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    const majorButton = screen.getByLabelText("Major");
    userEvent.click(majorButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("create-version-continue-button")
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByTestId("create-version-continue-button");
    userEvent.click(continueButton);

    await waitFor(() => {
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
      fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    await waitFor(() => {
      expect(
        screen.getByTestId(`create-new-version-${cqlLibrary[0].id}-button`)
      ).toBeInTheDocument();
    });
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    userEvent.click(versionButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    const majorButton = screen.getByLabelText("Major");
    userEvent.click(majorButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("create-version-continue-button")
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByTestId("create-version-continue-button");
    userEvent.click(continueButton);

    await waitFor(() => {
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
      fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceMock.mockImplementation(() => {
      return useCqlLibraryServiceMockRejected;
    });

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
      />
    );
    const viewEditButton = screen.getByTestId(
      `view/edit-cqlLibrary-button-${cqlLibrary[0].id}`
    );
    userEvent.click(viewEditButton);

    await waitFor(() => {
      expect(
        screen.getByTestId(`create-new-version-${cqlLibrary[0].id}-button`)
      ).toBeInTheDocument();
    });
    const versionButton = screen.getByTestId(
      `create-new-version-${cqlLibrary[0].id}-button`
    );
    userEvent.click(versionButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    const majorButton = screen.getByLabelText("Major");
    userEvent.click(majorButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("create-version-continue-button")
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByTestId("create-version-continue-button");
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Internal server error"
      );
    });
  });

  it("should not have delete draft option if not owner", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(false);
    (checkUserCanDelete as jest.Mock).mockReturnValue(false);
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
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
    ];
    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
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
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
    ];
    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
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

  it("should show checkboxes when featureflag is enabled", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibraryListCheckboxes: true,
    }));
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
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
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
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
      />
    );

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(3);
    fireEvent.click(checkBoxes[1]);
  });
});
