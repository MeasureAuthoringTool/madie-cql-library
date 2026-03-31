import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import LibraryShareDialog, {
  convertDate,
  sortSharedLibraries,
  LIBRARY_SHARING_EXPORT_SUCCESS,
  LIBRARY_SHARING_EXPORT_ERROR,
} from "./LibraryShareDialog";
import { CqlLibrary, UserStatus } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import {
  useIsRoleOrFeatureEnabled,
  useCqlLibraryServiceApi,
  CqlLibraryServiceApi,
  useUserServiceApi,
} from "@madie/madie-util";

jest.mock("file-saver", () => ({
  saveAs: jest.fn(),
}));

//@ts-ignore
const testUser = "test-fake-user@email.com";
// Mock @madie/madie-util at the top to resolve import error
jest.mock("@madie/madie-util", () => ({
  useCqlLibraryServiceApi: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => testUser,
  }),
  useIsRoleOrFeatureEnabled: jest.fn(),
  useUserServiceApi: jest.fn(() => ({
    harpId: "madietestuser",
    firstName: "Madie",
    lastName: "Test",
    email: "madie.test@semanticbits.com",
  })),
}));

const mockCqlLibrary1 = {
  id: "TestLibraryId1",
  libraryId: "TestLibraryId1",
  cqlLibraryName: "mockCqlLibrary1",
  cqlErrors: false,
  cql: "library testCql version '1.0.000'",
  librarySetId: "LibrarySetId1",
  createdAt: "",
  createdBy: "",
  lastModifiedAt: "",
  lastModifiedBy: "",
  librarySet: {
    acls: [
      { userId: "userId1", roles: ["SHARED_WITH"] },
      { userId: "userId2", roles: ["SHARED_WITH"] },
    ],
  },
} as CqlLibrary;

const mockCqlLibrary2 = {
  id: "TestLibraryId2",
  libraryId: "TestLibraryId2",
  cqlLibraryName: "mockCqlLibrary2",
  cqlErrors: false,
  cql: "library testCql version '1.0.000'",
  librarySetId: "LibrarySetId2",
  createdAt: "",
  createdBy: "",
  lastModifiedAt: "",
  lastModifiedBy: "",
  librarySet: {
    acls: [
      { userId: "userId1", roles: ["SHARED_WITH"] },
      { userId: "userId2", roles: ["SHARED_WITH"] },
    ],
  },
} as CqlLibrary;

const today = new Date();
const yesterday = new Date();
yesterday.setDate(new Date().getDate() - 1);

const mockGetSharedCqlLibraries = jest.fn().mockResolvedValue({
  [mockCqlLibrary1.id]: mockCqlLibrary1?.librarySet?.acls
    ? mockCqlLibrary1?.librarySet?.acls.map((acl) => ({
        userId: acl.userId,
        performedAt: yesterday.toISOString(),
      }))
    : [],
  [mockCqlLibrary2.id]: mockCqlLibrary1?.librarySet?.acls
    ? mockCqlLibrary1?.librarySet?.acls.map((acl) => ({
        userId: acl.userId,
        performedAt: yesterday.toISOString(),
      }))
    : [],
});

const mockGetRecentLibrariesByLibrarySetId = jest.fn((librarySetIds) => {
  const libraries = [];
  if (librarySetIds.includes("LibrarySetId1")) {
    libraries.push(mockCqlLibrary1);
  }
  if (librarySetIds.includes("LibrarySetId1")) {
    libraries.push(mockCqlLibrary2);
  }
  return Promise.resolve(libraries);
});

const mockShareLibraries = jest.fn().mockResolvedValue({
  [mockCqlLibrary1.id]: mockCqlLibrary1?.librarySet?.acls,
  [mockCqlLibrary2.id]: mockCqlLibrary2?.librarySet?.acls,
});

const mockUnshareLibraries = jest.fn().mockResolvedValue({
  [mockCqlLibrary1.id]: mockCqlLibrary1?.librarySet?.acls,
});

const mockLibraryServiceApi = {
  getSharedLibraries: mockGetSharedCqlLibraries,
  shareLibraries: mockShareLibraries,
  getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesByLibrarySetId,
  unshareLibraries: mockUnshareLibraries,
} as unknown as CqlLibraryServiceApi;

describe("Create Share Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );

    (useUserServiceApi as jest.Mock).mockReturnValue({
      getOwnerDetails: jest.fn().mockResolvedValue({
        harpId: "madietestuser",
        firstName: "Madie",
        lastName: "Test",
        email: "madie.test@semanticbits.com",
        userStatus: UserStatus[0],
      }),
    });

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);
  });

  it("should render share dialog", async () => {
    (
      mockLibraryServiceApi.getSharedLibraries as jest.Mock
    ).mockResolvedValueOnce(mockGetSharedCqlLibraries()); // <-- fix: call the function
    (
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId as jest.Mock
    ).mockResolvedValue([mockCqlLibrary1, mockCqlLibrary2]);
    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();
  });

  it("should render share dialog but not call getSharedLibraries if no library is passed in to share dialog component", () => {
    const mockLibraryServiceApi = {
      getSharedLibraries: jest.fn().mockResolvedValue([]),
      getRecentLibrariesByLibrarySetId: jest.fn().mockResolvedValue([]),
    } as unknown as CqlLibraryServiceApi;

    render(
      <LibraryShareDialog
        libraries={[]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).not.toBeCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).not.toBeCalled();
  });

  it("should render share dialog and display error message if getSharedLibaries call throws an exception", async () => {
    const errorMessage =
      "Unable to retrieve users that the selected library(s) is shared with. If the error persists, please contact the help desk.";

    (
      mockLibraryServiceApi.getSharedLibraries as jest.Mock
    ).mockRejectedValueOnce(new Error(errorMessage));
    (
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId as jest.Mock
    ).mockResolvedValue([mockCqlLibrary1, mockCqlLibrary2]);
    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId("share-dialog")).toBeInTheDocument();

    // Use waitFor to handle async call
    await waitFor(() => {
      expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
      expect(
        mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
      ).toBeCalled();
    });

    expect(await screen.findByText(errorMessage)).toBeVisible();
  });

  it("should not render share dialog if dialog is closed", () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={false}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });

  it("should render share dialog and show 'Share With' title in dialog", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Share With")).toBeInTheDocument();
  });

  it("should render share dialog and show 'Unshare' title in dialog", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Unshare From")).toBeInTheDocument();
  });

  it("should render share dialog and show HARP ID input if option is Share With", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    expect(await screen.findByTestId("harp-id-input")).toBeInTheDocument();
  });

  it("should render share dialog and not show HARP ID input if option is Unshare", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    expect(screen.queryByTestId("harp-id-input")).toBeNull();
  });

  it("should not add any user row to the grid for any library if all libraries already have that user", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-library-tbl")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId1" } });
    expect(harpIdInput.value).toBe("userId1");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    expect(saveBtn).toBeDisabled();
    expect(harpIdInput.value).toBe("userId1");
    const helperText = await screen.findByText(
      "The selected library(s) are already shared with this user."
    );
    expect(helperText).toBeVisible();
  });

  it("should not add any user row to the grid for any library if a string with all whitespace is entered", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-library-tbl")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    const userIdWithAllwhiteSpace = "    ";

    fireEvent.change(harpIdInput, {
      target: { value: userIdWithAllwhiteSpace },
    });
    expect(harpIdInput.value).toBe(userIdWithAllwhiteSpace);
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeDisabled();
      expect(harpIdInput.value).toBe("");
    });
  });

  it("should add a user row to the grid for each library that does not already have that user", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-library-tbl")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    expect(harpIdInput.value).toBe("userId3");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    //Row 2
    expect(
      screen.getByTestId("TestLibraryId2 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestLibraryId2 userId3_dateShared")
    ).toHaveTextContent(convertDate(today.toUTCString()));
    expect(
      screen.getByTestId("TestLibraryId2 userId1_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
    expect(
      screen.getByTestId("TestLibraryId2 userId2_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
  });

  it("should add a user row to the grid for each library that does not already have that user and save successfully after clicking Save button.", async () => {
    const mockOnClose = jest.fn();

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={mockOnClose}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-library-tbl")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    expect(harpIdInput.value).toBe("userId3");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockLibraryServiceApi.shareLibraries).toBeCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should add a user row to the grid for each library that does not already have that user and fail after clicking Save button.", async () => {
    const errorMessage =
      "Unable to share the selected libraries with the added users. If the error persists, please contact the help desk.";

    const mockLibraryServiceApi = {
      getSharedLibraries: mockGetSharedCqlLibraries,
      getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesByLibrarySetId,
      shareLibraries: jest.fn().mockRejectedValue(new Error(errorMessage)),
    } as unknown as CqlLibraryServiceApi;

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );

    const mockOnClose = jest.fn();

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={mockOnClose}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-library-tbl")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    expect(harpIdInput.value).toBe("userId3");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockLibraryServiceApi.shareLibraries).toBeCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should add a user row to the grid for each library that does not already have that user (after stripping all whitespace in HARP ID field)", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-library-tbl")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    const userIdWithExtraSpaces = " userId 3 ";

    fireEvent.change(harpIdInput, { target: { value: userIdWithExtraSpaces } });
    expect(harpIdInput.value).toBe(userIdWithExtraSpaces);
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });
    //Row 2
    expect(
      screen.getByTestId("TestLibraryId2 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestLibraryId2 userId3_dateShared")
    ).toHaveTextContent(convertDate(today.toUTCString()));
    //Subrow 2 of Row 2
    expect(
      screen.getByTestId("TestLibraryId2 userId1_userId")
    ).toHaveTextContent("userId1");
    expect(
      screen.getByTestId("TestLibraryId2 userId1_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
    //Subrow 3 of Row 2
    expect(
      screen.getByTestId("TestLibraryId2 userId2_userId")
    ).toHaveTextContent("userId2");
    expect(
      screen.getByTestId("TestLibraryId2 userId2_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
  });

  it("should display share library table", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const table = await screen.findByTestId("share-library-tbl");
    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[0]).toHaveTextContent("Library");
    expect(tableHeaders[1]).toHaveTextContent("Shared With");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(mockCqlLibrary1.cqlLibraryName);
  });

  it("should display unshare library table", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const table = await screen.findByTestId("share-library-tbl");
    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[0]).toHaveTextContent("Library");
    expect(tableHeaders[1]).toHaveTextContent("Shared With");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(mockCqlLibrary1.cqlLibraryName);
  });

  it("should successfully unshare a user from a library.", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(5);
    expect(checkBoxes[0]).toBeChecked();
    expect(checkBoxes[1]).toBeChecked();

    userEvent.click(checkBoxes[0]);

    await waitFor(() => expect(checkBoxes[0]).not.toBeChecked());
    expect(saveBtn).toBeEnabled();

    userEvent.click(saveBtn);

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    userEvent.click(acceptBtn);
    await waitFor(async () => {
      expect(mockLibraryServiceApi.unshareLibraries).toBeCalled();
    });
  });

  it("should fail to unshare a user from a library.", async () => {
    const errorMessage =
      "Unable to unshare the selected library(s) with the users who were unchecked. If the error persists, please contact the help desk.";

    const mockLibraryServiceApi = {
      getSharedLibraries: mockGetSharedCqlLibraries,
      getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesByLibrarySetId,
      unshareLibraries: jest.fn().mockRejectedValue(new Error(errorMessage)),
    } as unknown as CqlLibraryServiceApi;

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(5);
    expect(checkBoxes[0]).toBeChecked();
    expect(checkBoxes[1]).toBeChecked();

    userEvent.click(checkBoxes[0]);

    await waitFor(() => expect(checkBoxes[0]).not.toBeChecked());
    expect(saveBtn).toBeEnabled();

    userEvent.click(saveBtn);

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    userEvent.click(acceptBtn);
    await waitFor(async () => {
      expect(mockLibraryServiceApi.unshareLibraries).toBeCalled();
    });
  });

  it("should render confirmation dialog only", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"UnshareFromMe"}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("share-confirmation-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });

  it("should close confirmation dialog and call onClose when option is 'UnshareFromMe'", async () => {
    const onCloseMock = jest.fn();

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="UnshareFromMe"
        onClose={onCloseMock}
      />
    );

    expect(screen.getByTestId("share-confirmation-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("share-dialog")).toBeNull();

    const cancelButton = screen.getByTestId(
      "share-confirmation-dialog-cancel-button"
    );
    userEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });

  it("should successfully unshare a user from a library", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="UnshareFromMe"
        onClose={jest.fn()}
      />
    );

    expect(
      await screen.findByTestId("share-confirmation-dialog")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("share-dialog")).toBeNull();

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    userEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mockLibraryServiceApi.unshareLibraries).toBeCalled();
    });
  });

  it("should fail to unshare a user from a library with UnshareFromMe", async () => {
    const errorMessage =
      "Unable to unshare the selected library(s) with the users who were unchecked. If the error persists, please contact the help desk.";

    const mockLibraryServiceApiWithError = {
      ...mockLibraryServiceApi,
      unshareLibraries: jest.fn().mockRejectedValue(new Error(errorMessage)),
    };

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApiWithError
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="UnshareFromMe"
        onClose={jest.fn()}
      />
    );

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    userEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mockLibraryServiceApiWithError.unshareLibraries).toBeCalled();
    });
  });

  it("should render warning content with library names and current user", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="UnshareFromMe"
        onClose={jest.fn()}
      />
    );

    const confirmationDialog = await screen.findByTestId(
      "share-confirmation-dialog"
    );
    expect(confirmationDialog).toBeInTheDocument();

    // Check the warning text
    expect(screen.getByText("You are about to unshare")).toBeInTheDocument();

    // Each library name should appear
    expect(
      screen.getByText(mockCqlLibrary1.cqlLibraryName)
    ).toBeInTheDocument();
    expect(
      screen.getByText(mockCqlLibrary2.cqlLibraryName)
    ).toBeInTheDocument();

    // The current user should appear in the list
    const userListItems = screen.getAllByRole("listitem");
    expect(userListItems.length).toBe(2);
    expect(userListItems[0]).toHaveTextContent("test-fake-user@email.com");
    expect(userListItems[1]).toHaveTextContent("test-fake-user@email.com");
  });

  it("should not add a user row to the grid if the user is not a valid madie user after clicking Save button.", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getOwnerDetails: jest.fn().mockRejectedValue({
        status: 400,
        error: "invalid madie user",
      }),
    });
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    const harpIdInput = screen.getByLabelText("HARP ID");
    fireEvent.change(harpIdInput, { target: { value: "invaliduser" } });
    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    fireEvent.click(addUserBtn);
    await waitFor(() => {
      expect(
        screen.getByText(
          "The provided HARP ID invaliduser is not associated with an active MADiE user."
        )
      ).toBeInTheDocument();
    });
    // Optionally, check that the input value is still present
    expect(harpIdInput).toHaveValue("invaliduser");
  });

  it("should not add a user row to the grid if the user is not active after clicking Save button.", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getOwnerDetails: jest.fn().mockResolvedValue({
        harpId: "madietestuser",
        firstName: "Madie",
        lastName: "Test",
        email: "madie.test@semanticbits.com",
        userStatus: UserStatus[1],
      }),
    });
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    const harpIdInput = screen.getByLabelText("HARP ID");
    fireEvent.change(harpIdInput, { target: { value: "invaliduser" } });
    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    fireEvent.click(addUserBtn);
    await waitFor(() => {
      expect(
        screen.getByText(
          "The provided HARP ID invaliduser is not associated with an active MADiE user."
        )
      ).toBeInTheDocument();
    });
    // Optionally, check that the input value is still present
    expect(harpIdInput).toHaveValue("invaliduser");
  });

  it("should not add a user row to the grid getting user details returns status code other than 400 after clicking Save button.", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getOwnerDetails: jest.fn().mockRejectedValue({
        response: {
          status: 500,
          error: "server error",
        },
      }),
    });
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    const harpIdInput = screen.getByLabelText("HARP ID");
    fireEvent.change(harpIdInput, { target: { value: "invaliduser" } });
    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    fireEvent.click(addUserBtn);
    screen.debug(undefined, 8000000);
    await waitFor(() => {
      expect(
        screen.queryByText(
          "The provided HARP ID invaliduser is not associated with an active MADiE user."
        )
      ).not.toBeInTheDocument();
    });
    expect(harpIdInput).toHaveValue("invaliduser");
  });

  it("test convertDate when date is null", () => {
    const convertedDate = convertDate(null);
    expect(convertedDate).toBe("");
  });

  it("test getErrorMessage when toastMeasage is from error?.response?.data?.message", async () => {
    const errorMessage =
      "Unable to share the selected libraries with the added users. If the error persists, please contact the help desk.";
    const mockLibraryServiceApi = {
      getSharedLibraries: mockGetSharedCqlLibraries,
      getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesByLibrarySetId,
      shareLibraries: jest
        .fn()
        .mockRejectedValue({ response: { data: { message: errorMessage } } }),
    } as unknown as CqlLibraryServiceApi;

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );

    const mockOnClose = jest.fn();

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={mockOnClose}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-library-tbl")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();
    fireEvent.focus(harpIdInput);
    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    expect(harpIdInput.value).toBe("userId3");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockLibraryServiceApi.shareLibraries).toBeCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("test option other than 'Share With', 'Unshare', or 'UnshareFromMe'", () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"InvalidOption"}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });
});

describe("sortSharedLibraries", () => {
  it("should return -1 if either dateShared is '-'", () => {
    const a = {
      dateShared: "-",
      libraryId: "1",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    const b = {
      dateShared: "2023-01-01",
      libraryId: "2",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    expect(sortSharedLibraries(a, b)).toBe(-1);

    const c = {
      dateShared: "2023-01-01",
      libraryId: "1",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    const d = {
      dateShared: "-",
      libraryId: "2",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    expect(sortSharedLibraries(c, d)).toBe(-1);
  });
});

describe("Admin user with AdminShareLibrary feature flag enabled", () => {
  beforeEach(() => {
    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(true);
    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should display export user list link when user is admin and feature flag is enabled", () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="Unshare"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("export-user-list-button")).toBeInTheDocument();
  });

  it("should successfully export user list when export button is clicked", async () => {
    const mockBlob = new Blob(["test content"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const mockGetSharedAccessReportForLibraries = jest
      .fn()
      .mockResolvedValue(mockBlob);

    const mockLibraryServiceApiWithExport = {
      getSharedLibraries: mockGetSharedCqlLibraries,
      getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesByLibrarySetId,
      shareLibraries: mockShareLibraries,
      unshareLibraries: mockUnshareLibraries,
      getSharedAccessReportForLibraries: mockGetSharedAccessReportForLibraries,
    } as unknown as CqlLibraryServiceApi;

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApiWithExport
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="Unshare"
        onClose={jest.fn()}
      />
    );

    await screen.findByTestId("share-library-tbl");

    const exportButton = screen.getByTestId("export-user-list-button");
    userEvent.click(exportButton);

    await waitFor(() => {
      expect(mockGetSharedAccessReportForLibraries).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(LIBRARY_SHARING_EXPORT_SUCCESS)
      ).toBeInTheDocument();
    });
  });

  it("should show error toast when export user list fails", async () => {
    const mockGetSharedAccessReportForLibraries = jest
      .fn()
      .mockRejectedValue(new Error("Export failed"));

    const mockLibraryServiceApiWithExport = {
      getSharedLibraries: mockGetSharedCqlLibraries,
      getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesByLibrarySetId,
      shareLibraries: mockShareLibraries,
      unshareLibraries: mockUnshareLibraries,
      getSharedAccessReportForLibraries: mockGetSharedAccessReportForLibraries,
    } as unknown as CqlLibraryServiceApi;

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApiWithExport
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="Unshare"
        onClose={jest.fn()}
      />
    );

    await screen.findByTestId("share-library-tbl");

    const exportButton = screen.getByTestId("export-user-list-button");
    userEvent.click(exportButton);

    await waitFor(() => {
      expect(mockGetSharedAccessReportForLibraries).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(LIBRARY_SHARING_EXPORT_ERROR)
      ).toBeInTheDocument();
    });
  });

  it("should not display export user list link when feature flag is disabled", () => {
    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option="Unshare"
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByTestId("export-user-list-button")).toBeNull();
  });
});

describe("convertDate function", () => {
  it("returns empty string when date is null", () => {
    expect(convertDate(null)).toBe("");
  });

  it("returns empty string when date is undefined", () => {
    expect(convertDate(undefined)).toBe("");
  });

  it("returns empty string when date is empty string", () => {
    expect(convertDate("")).toBe("");
  });

  it("formats date correctly without leading zero in month", () => {
    const date = "2025-01-15T12:00:00Z";
    expect(convertDate(date)).toBe("1/15/2025");
  });

  it("formats date correctly for double digit month", () => {
    const date = "2025-12-25T12:00:00Z";
    expect(convertDate(date)).toBe("12/25/2025");
  });

  it("formats date correctly with leading zero in day", () => {
    const date = "2025-03-01T12:00:00Z";
    expect(convertDate(date)).toBe("3/01/2025");
  });
});
