import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import LibraryShareDialog, {
  convertDate,
  sortSharedLibraries,
} from "./LibraryShareDialog";
import { CqlLibrary } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import {
  useIsRoleOrFeatureEnabled,
  useCqlLibraryServiceApi,
  CqlLibraryServiceApi,
  useUserServiceApi,
} from "@madie/madie-util";

// Mock @madie/madie-util at the top to resolve import error
jest.mock("@madie/madie-util", () => ({
  useCqlLibraryServiceApi: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test-fake-user@email.com",
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
        userStatus: "ACTIVE",
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();
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
    expect(mockLibraryServiceApi.getSharedLibraries).not.toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).not.toHaveBeenCalled();
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
      expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
      expect(
        mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
      ).toHaveBeenCalled();
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

  it("should render share dialog and show 'Share With...' title in dialog", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Share With...")).toBeInTheDocument();
  });

  it("should render share dialog and show 'Unshare From...' title in dialog", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Unshare From...")).toBeInTheDocument();
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

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
    fireEvent.keyDown(harpIdInput, { key: "Enter" });
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    expect(saveBtn).toBeDisabled();
    expect(harpIdInput.value).toBe("");
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();

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
    // Press Enter to try creating a chip - whitespace should not create a chip
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      // No chip should be created for whitespace, button stays disabled
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeDisabled();
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    // Type and press Enter to create chip
    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(addUserBtn).toBeEnabled();
    });

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
    });

    // Rows are now displayed flat without expansion
    //Row 1
    expect(
      screen.getByTestId("TestLibraryId1 userId3_cqlLibraryName")
    ).toHaveTextContent("mockCqlLibrary1");
    expect(
      screen.getByTestId("TestLibraryId1 userId3_userId")
    ).toHaveTextContent("userId3");

    //Row 2
    expect(
      screen.getByTestId("TestLibraryId2 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestLibraryId2 userId3_dateShared")
    ).toHaveTextContent(convertDate(today.toUTCString()));
    expect(
      screen.getByTestId("TestLibraryId2 userId1_userId")
    ).toHaveTextContent("userId1");
    expect(
      screen.getByTestId("TestLibraryId2 userId1_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
    expect(
      screen.getByTestId("TestLibraryId2 userId2_userId")
    ).toHaveTextContent("userId2");
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    // Type and press Enter to create chip
    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(addUserBtn).toBeEnabled();
    });

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockLibraryServiceApi.shareLibraries).toHaveBeenCalled();
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    // Type and press Enter to create chip
    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(addUserBtn).toBeEnabled();
    });

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockLibraryServiceApi.shareLibraries).toHaveBeenCalled();
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    const userIdWithExtraSpaces = " userId 3 ";

    // Type and press Enter to create chip (with spaces that will be stripped)
    fireEvent.change(harpIdInput, { target: { value: userIdWithExtraSpaces } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(addUserBtn).toBeEnabled();
    });

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
    });

    // With flattened rows, new user is added after existing users
    // The new user row won't have the library name (only first row has it)
    // userId3 (stripped from " userId 3 ") should be added to both libraries
    expect(
      screen.getByTestId("TestLibraryId1 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestLibraryId2 userId3_userId")
    ).toHaveTextContent("userId3");

    // Existing users should still be visible
    expect(
      screen.getByTestId("TestLibraryId1 userId1_userId")
    ).toHaveTextContent("userId1");
    expect(
      screen.getByTestId("TestLibraryId2 userId1_userId")
    ).toHaveTextContent("userId1");
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const table = await screen.findByTestId("share-library-tbl");
    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[0]).toHaveTextContent("Library");
    expect(tableHeaders[1]).toHaveTextContent("Shared With");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");

    const tableRows = table.querySelectorAll("tbody tr");

    // With flattened structure: mockCqlLibrary1 has 2 users (rows 0, 1), mockCqlLibrary2 starts at row 2
    expect(tableRows[0]).toHaveTextContent(mockCqlLibrary1.cqlLibraryName);
    expect(tableRows[2]).toHaveTextContent(mockCqlLibrary2.cqlLibraryName);
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const table = await screen.findByTestId("share-library-tbl");
    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[0]).toHaveTextContent("Library");
    expect(tableHeaders[1]).toHaveTextContent("Shared With");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");

    const tableRows = table.querySelectorAll("tbody tr");

    // With flattened structure: mockCqlLibrary1 has 2 users (rows 0, 1), mockCqlLibrary2 starts at row 2
    expect(tableRows[0]).toHaveTextContent(mockCqlLibrary1.cqlLibraryName);
    expect(tableRows[2]).toHaveTextContent(mockCqlLibrary2.cqlLibraryName);
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();

    // Rows are now displayed flat - checkboxes should be visible without expanding
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBeGreaterThan(0);
    expect(checkBoxes[0]).toBeChecked();

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
      expect(mockLibraryServiceApi.unshareLibraries).toHaveBeenCalled();
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();

    // Rows are now displayed flat - checkboxes should be visible without expanding
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBeGreaterThan(0);
    expect(checkBoxes[0]).toBeChecked();

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
      expect(mockLibraryServiceApi.unshareLibraries).toHaveBeenCalled();
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
      expect(mockLibraryServiceApi.unshareLibraries).toHaveBeenCalled();
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
      expect(
        mockLibraryServiceApiWithError.unshareLibraries
      ).toHaveBeenCalled();
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

  // Skip: User validation via getOwnerDetails is not implemented in the component
  it.skip("should not add a user row to the grid if the user is not a valid madie user after clicking Save button.", async () => {
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
    const harpIdInput = await screen.findByTestId("harp-id-input");
    // Type and press Enter to create chip
    fireEvent.change(harpIdInput, { target: { value: "invaliduser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    fireEvent.click(addUserBtn);
    await waitFor(() => {
      expect(
        screen.getByText(
          "The provided HARP ID invaliduser is not associated with an active MADiE user."
        )
      ).toBeInTheDocument();
    });
  });

  // Skip: User validation via getOwnerDetails is not implemented in the component
  it.skip("should not add a user row to the grid if the user is not active after clicking Save button.", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getOwnerDetails: jest.fn().mockResolvedValue({
        harpId: "madietestuser",
        firstName: "Madie",
        lastName: "Test",
        email: "madie.test@semanticbits.com",
        userStatus: "INACTIVE",
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
    const harpIdInput = await screen.findByTestId("harp-id-input");
    // Type and press Enter to create chip
    fireEvent.change(harpIdInput, { target: { value: "invaliduser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    fireEvent.click(addUserBtn);
    await waitFor(() => {
      expect(
        screen.getByText(
          "The provided HARP ID invaliduser is not associated with an active MADiE user."
        )
      ).toBeInTheDocument();
    });
  });

  // Skip: User validation via getOwnerDetails is not implemented in the component
  it.skip("should not add a user row to the grid getting user details returns status code other than 400 after clicking Save button.", async () => {
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
    const harpIdInput = await screen.findByTestId("harp-id-input");
    // Type and press Enter to create chip
    fireEvent.change(harpIdInput, { target: { value: "invaliduser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = screen.getByRole("button", { name: /add user/i });
    fireEvent.click(addUserBtn);
    await waitFor(() => {
      expect(
        screen.queryByText(
          "The provided HARP ID invaliduser is not associated with an active MADiE user."
        )
      ).not.toBeInTheDocument();
    });
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
    expect(mockLibraryServiceApi.getSharedLibraries).toHaveBeenCalled();
    expect(
      mockLibraryServiceApi.getRecentLibrariesByLibrarySetId
    ).toHaveBeenCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();
    fireEvent.focus(harpIdInput);
    // Type and press Enter to create chip
    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(addUserBtn).toBeEnabled();
    });

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockLibraryServiceApi.shareLibraries).toHaveBeenCalled();
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
});

describe("Multiple HARP ID chip input functionality", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should create a chip when pressing Enter key", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "newUser1" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
      expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent(
        "newUser1"
      );
    });
  });

  it("should create a chip when pressing comma key", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "newUser1" } });
    fireEvent.keyDown(harpIdInput, { key: "," });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
      expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent(
        "newUser1"
      );
    });
  });

  it("should create multiple chips for multiple HARP IDs", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "user1" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    fireEvent.change(harpIdInput, { target: { value: "user2" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent("user1");
      expect(screen.getByTestId("harp-id-chip-1")).toHaveTextContent("user2");
    });
  });

  it("should not create duplicate chips for the same HARP ID", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "duplicateUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    fireEvent.change(harpIdInput, { target: { value: "duplicateUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.queryByTestId("harp-id-chip-1")).toBeNull();
    });
  });

  it("should not create a chip for empty input", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "   " } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.queryByTestId("harp-id-chip-0")).toBeNull();
    });
  });

  it("should trim whitespace when creating chips", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "  trimmedUser  " } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent(
        "trimmedUser"
      );
    });
  });

  it("should enable Add User(s) button when chips are present", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "newUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(addUserBtn).toBeEnabled();
    });
  });

  it("should add multiple users to libraries when clicking Add User(s) button", async () => {
    const mockOnClose = jest.fn();

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={mockOnClose}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "newUser1" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    fireEvent.change(harpIdInput, { target: { value: "newUser2" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
      expect(screen.getByTestId("harp-id-chip-1")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(screen.getByTestId("share-save-button")).toBeEnabled();
    });

    expect(
      screen.getByTestId("TestLibraryId1 newUser1_userId")
    ).toHaveTextContent("newUser1");
    expect(
      screen.getByTestId("TestLibraryId1 newUser2_userId")
    ).toHaveTextContent("newUser2");
  });

  it("should clear chips after clicking Add User(s) button", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "newUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("harp-id-chip-0")).toBeNull();
    });
  });

  it("should create chip on blur when input has value", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "blurUser" } });
    fireEvent.blur(harpIdInput);

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toHaveTextContent(
        "blurUser"
      );
    });
  });
});

describe("Flattened row display", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should display first shared user on same row as library name", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const table = await screen.findByTestId("share-library-tbl");
    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(mockCqlLibrary1.cqlLibraryName);
    expect(tableRows[0]).toHaveTextContent("userId1");
  });

  it("should display subsequent shared users on separate rows without library name", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const table = await screen.findByTestId("share-library-tbl");
    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[1]).toHaveTextContent("userId2");
    expect(tableRows[1]).not.toHaveTextContent(mockCqlLibrary1.cqlLibraryName);
  });

  it("should show all users without needing to expand rows", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    expect(
      screen.getByTestId("TestLibraryId1 userId1_userId")
    ).toHaveTextContent("userId1");
    expect(
      screen.getByTestId("TestLibraryId1 userId2_userId")
    ).toHaveTextContent("userId2");
  });

  it("should display library with no shared users showing empty user fields", async () => {
    const mockLibraryWithNoSharedUsers = {
      ...mockCqlLibrary1,
      id: "LibraryNoUsers",
      cqlLibraryName: "LibraryWithNoUsers",
      librarySetId: "LibrarySetNoUsers",
      librarySet: {
        acls: [],
      },
    } as CqlLibrary;

    const mockGetSharedCqlLibrariesEmpty = jest.fn().mockResolvedValue({
      [mockLibraryWithNoSharedUsers.id]: [],
    });

    const mockGetRecentLibrariesEmpty = jest
      .fn()
      .mockResolvedValue([mockLibraryWithNoSharedUsers]);

    const mockLibraryServiceApiEmpty = {
      getSharedLibraries: mockGetSharedCqlLibrariesEmpty,
      getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesEmpty,
    } as unknown as CqlLibraryServiceApi;

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApiEmpty
    );

    render(
      <LibraryShareDialog
        libraries={[mockLibraryWithNoSharedUsers]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const table = await screen.findByTestId("share-library-tbl");
    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows.length).toBe(1);
    expect(tableRows[0]).toHaveTextContent("LibraryWithNoUsers");
  });

  it("should display share library table without expand column", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const table = await screen.findByTestId("share-library-tbl");
    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders.length).toBe(3);
    expect(tableHeaders[0]).toHaveTextContent("Library");
    expect(tableHeaders[1]).toHaveTextContent("Shared With");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");
  });
});

describe("Bulk user validation with getBulkUserDetails", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should add only valid users when some users are invalid", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockResolvedValue({
        validUser: { userStatus: "ACTIVE" },
        invalidUser: { userStatus: "INACTIVE" },
      }),
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "validUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    fireEvent.change(harpIdInput, { target: { value: "invalidUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
      expect(screen.getByTestId("harp-id-chip-1")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByTestId("TestLibraryId1 validUser_userId")
      ).toHaveTextContent("validUser");
    });

    expect(
      screen.getByText(
        /invalidUser.*is not associated with an active MADiE user/i
      )
    ).toBeInTheDocument();
  });

  it("should show error for multiple invalid users", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockResolvedValue({
        invalidUser1: { userStatus: "INACTIVE" },
        invalidUser2: { userStatus: "INACTIVE" },
      }),
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "invalidUser1" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    fireEvent.change(harpIdInput, { target: { value: "invalidUser2" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
      expect(screen.getByTestId("harp-id-chip-1")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /invalidUser1, invalidUser2.*are not associated with an active MADiE user/i
        )
      ).toBeInTheDocument();
    });
  });

  it("should show toast error when bulk user validation fails with non-400 error", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockRejectedValue({
        response: { status: 500 },
      }),
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "someUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Unable to validate the provided HARP ID. If the error persists, please contact the help desk."
        )
      ).toBeInTheDocument();
    });
  });

  it("should show error when bulk user validation fails with 400 status", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockRejectedValue({
        response: { status: 400 },
      }),
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "badUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "The provided HARP ID is not associated with an active MADiE user."
        )
      ).toBeInTheDocument();
    });
  });

  it("should skip users already shared with all libraries", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockResolvedValue({
        userId1: { userStatus: "ACTIVE" },
      }),
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "userId1" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "The selected library(s) are already shared with the entered user(s)."
        )
      ).toBeInTheDocument();
    });
  });

  it("should handle input value still pending when Add User is clicked", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockResolvedValue({
        pendingUser: { userStatus: "ACTIVE" },
      }),
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "pendingUser" } });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByTestId("TestLibraryId1 pendingUser_userId")
      ).toHaveTextContent("pendingUser");
    });
  });
});

describe("Export user list functionality", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(true);
  });

  it("should show success toast on successful export", async () => {
    const mockBlob = new Blob(["test"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const mockLibraryServiceApiWithExport = {
      ...mockLibraryServiceApi,
      getSharedAccessReportForLibraries: jest.fn().mockResolvedValue(mockBlob),
    };

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApiWithExport
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const exportBtn = await screen.findByTestId("export-user-list-button");
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Library Sharing Report exported successfully.")
      ).toBeInTheDocument();
    });
  });

  it("should show error toast on failed export", async () => {
    const mockLibraryServiceApiWithExportError = {
      ...mockLibraryServiceApi,
      getSharedAccessReportForLibraries: jest
        .fn()
        .mockRejectedValue(new Error("Export failed")),
    };

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApiWithExportError
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const exportBtn = await screen.findByTestId("export-user-list-button");
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Unable to export the user list. Please try again. If the issue persists, please contact the help desk."
        )
      ).toBeInTheDocument();
    });
  });

  it("should not show export button when admin feature is disabled", async () => {
    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    expect(screen.queryByTestId("export-user-list-button")).toBeNull();
  });
});

describe("convertDate utility function", () => {
  it("should return empty string for undefined date", () => {
    const convertedDate = convertDate(undefined);
    expect(convertedDate).toBe("");
  });

  it("should format date with single digit month without leading zero", () => {
    const convertedDate = convertDate("2023-01-15T00:00:00.000Z");
    expect(convertedDate).toBe("1/15/2023");
  });

  it("should format date with double digit month", () => {
    const convertedDate = convertDate("2023-12-25T00:00:00.000Z");
    expect(convertedDate).toBe("12/25/2023");
  });

  it("should format date with day padded with leading zero", () => {
    const convertedDate = convertDate("2023-06-05T00:00:00.000Z");
    expect(convertedDate).toBe("6/05/2023");
  });
});

describe("sortSharedLibraries utility function", () => {
  it("should sort libraries by date in descending order", () => {
    const a = {
      dateShared: "2023-01-01",
      libraryId: "1",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    const b = {
      dateShared: "2023-06-01",
      libraryId: "2",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    expect(sortSharedLibraries(a, b)).toBeGreaterThan(0);
  });

  it("should return negative when first date is more recent", () => {
    const a = {
      dateShared: "2023-12-01",
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
    expect(sortSharedLibraries(a, b)).toBeLessThan(0);
  });

  it("should return 0 when dates are equal", () => {
    const a = {
      dateShared: "2023-06-15",
      libraryId: "1",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    const b = {
      dateShared: "2023-06-15",
      libraryId: "2",
      cqlLibraryName: "",
      userId: "",
      subRows: [],
    };
    expect(sortSharedLibraries(a, b)).toBe(0);
  });
});

describe("Unshare dialog select all functionality", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should disable save button when all rows are selected", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
  });

  it("should show select all checkbox in unshare mode", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    expect(screen.getByTestId("shared-with-select-all")).toBeInTheDocument();
  });

  it("should not show select all checkbox in share mode", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    expect(screen.queryByTestId("shared-with-select-all")).toBeNull();
  });

  it("should toggle all rows when select all is clicked", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const selectAllCheckbox = screen.getByTestId("shared-with-select-all");
    const checkBoxes = await screen.findAllByRole("checkbox");

    checkBoxes.slice(1).forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    userEvent.click(selectAllCheckbox);

    await waitFor(() => {
      checkBoxes.slice(1).forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });
});

describe("Cancel button functionality", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should call onClose when cancel button is clicked in Share dialog", async () => {
    const onCloseMock = jest.fn();

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={onCloseMock}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const cancelBtn = await screen.findByTestId("share-cancel-button");
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked in Unshare dialog", async () => {
    const onCloseMock = jest.fn();

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Unshare"}
        onClose={onCloseMock}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const cancelBtn = await screen.findByTestId("share-cancel-button");
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });
});

describe("Informational text display", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should display correct info text for Share With option", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    expect(
      screen.getByText(
        /When sharing a Library, all versions and drafts are shared/i
      )
    ).toBeInTheDocument();
  });

  it("should display correct info text for Unshare option", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    expect(
      screen.getByText(/To unshare library\(s\), deselect the usernames/i)
    ).toBeInTheDocument();
  });
});

describe("Multiple libraries sharing", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );

    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockResolvedValue({
        newSharedUser: { userStatus: "ACTIVE" },
      }),
    });
  });

  it("should add user to multiple libraries at once", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "newSharedUser" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByTestId("TestLibraryId1 newSharedUser_userId")
      ).toHaveTextContent("newSharedUser");
      expect(
        screen.getByTestId("TestLibraryId2 newSharedUser_userId")
      ).toHaveTextContent("newSharedUser");
    });
  });
});

describe("Helper text display", () => {
  beforeEach(() => {
    jest.resetModules();

    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);

    (useCqlLibraryServiceApi as jest.Mock).mockReturnValue(
      mockLibraryServiceApi
    );
  });

  it("should display default helper text when no error", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    expect(
      screen.getByText("Hit comma (,) to add multiple")
    ).toBeInTheDocument();
  });

  it("should clear error when input changes", async () => {
    (useUserServiceApi as jest.Mock).mockReturnValue({
      getBulkUserDetails: jest.fn().mockResolvedValue({
        userId1: { userStatus: "ACTIVE" },
      }),
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-library-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "userId1" } });
    fireEvent.keyDown(harpIdInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("harp-id-chip-0")).toBeInTheDocument();
    });

    const addUserBtn = await screen.findByTestId("add-user-btn");
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "The selected library(s) are already shared with the entered user(s)."
        )
      ).toBeInTheDocument();
    });

    fireEvent.change(harpIdInput, { target: { value: "new" } });

    await waitFor(() => {
      expect(
        screen.getByText("Hit comma (,) to add multiple")
      ).toBeInTheDocument();
    });
  });
});
