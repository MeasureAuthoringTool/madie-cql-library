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
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
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
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
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
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
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
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
      />
    );

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(3);
    fireEvent.click(checkBoxes[1]);
  });

  it("buttons featureflag: shows just a view button when cannot edit", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(false);
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibraryListCheckboxes: true,
      LibraryListButtons: true,
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
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
      />
    );

    expect(
      await screen.findByTestId(
        "view-cql-library-button-622e1f46d1fd3729d861e6cb"
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View/Edit" })
    ).not.toBeInTheDocument();
  });
  it("buttons featureflag: shows just an edit button when can edit", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibraryListCheckboxes: true,
      LibraryListButtons: true,
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
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
      />
    );
    expect(
      await screen.findByTestId(
        "edit-cql-library-button-622e1f46d1fd3729d861e6cb"
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View/Edit" })
    ).not.toBeInTheDocument();
  });
});
