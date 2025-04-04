import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import LibraryShareDialog, { SharedUser } from "./LibraryShareDialog";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "../../../api/useCqlLibraryServiceApi";
import { CqlLibrary } from "@madie/madie-models";

const testUser = "test user";

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

jest.mock("../../../api/useCqlLibraryServiceApi");

const useLibraryServiceMock =
  useCqlLibraryServiceApi as jest.Mock<CqlLibraryServiceApi>;

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

const mockLibraryServiceApi = {
  getSharedLibraries: mockGetSharedCqlLibraries,
  shareLibraries: mockShareLibraries,
  getRecentLibrariesByLibrarySetId: mockGetRecentLibrariesByLibrarySetId,
} as unknown as CqlLibraryServiceApi;

describe("Create Share Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();

    useLibraryServiceMock.mockImplementation(() => {
      return mockLibraryServiceApi;
    });
  });

  it("should render share dialog", async () => {
    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    const table = await screen.findByTestId("share-library-tbl");

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();
  });

  it("should render share dialog but not call getSharedLibraries if no library is passed in to share dialog component", () => {
    const mockLibraryServiceApi = {
      getSharedLibraries: jest.fn().mockResolvedValue([]),
      getRecentLibrariesByLibrarySetId: jest.fn().mockResolvedValue([]),
    } as unknown as CqlLibraryServiceApi;

    useLibraryServiceMock.mockImplementation(() => {
      return mockLibraryServiceApi;
    });

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
      "Unable to retrieve users that the selected libraries is shared with. If the error persists, please contact the help desk.";

    const mockLibraryServiceApi = {
      getSharedLibraries: jest.fn().mockRejectedValue(new Error(errorMessage)),
      getRecentLibrariesByLibrarySetId: jest
        .fn()
        .mockResolvedValue([mockCqlLibrary1, mockCqlLibrary2]),
    } as unknown as CqlLibraryServiceApi;

    useLibraryServiceMock.mockImplementation(() => {
      return mockLibraryServiceApi;
    });

    render(
      <LibraryShareDialog
        libraries={[mockCqlLibrary1, mockCqlLibrary2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    const table = await screen.findByTestId("share-library-tbl");
    expect(mockLibraryServiceApi.getSharedLibraries).toBeCalled();
    expect(mockLibraryServiceApi.getRecentLibrariesByLibrarySetId).toBeCalled();
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
    expect(await screen.findByText("Unshare")).toBeInTheDocument();
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
    const table = await screen.findByTestId("share-library-tbl");
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
      "The selected Libraries are already shared with this user."
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

    const expandButtonMockLibrary1 = screen.getByTestId(
      `expand-button-TestLibraryId1`
    );
    fireEvent.click(expandButtonMockLibrary1);

    const expandButtonMockLibrary2 = screen.getByTestId(
      `expand-button-TestLibraryId2`
    );
    fireEvent.click(expandButtonMockLibrary2);

    //Row 1
    expect(
      screen.getByTestId("0_cqlLibraryName_TestLibraryId1")
    ).toHaveTextContent("mockCqlLibrary1");
    //Subrow 1 of Row 1
    expect(screen.getByTestId("0.0_userId_TestLibraryId1")).toHaveTextContent(
      "userId3"
    );

    //Row 2
    expect(
      screen.getByTestId("1_cqlLibraryName_TestLibraryId2")
    ).toHaveTextContent("mockCqlLibrary2");
    //Subrow 1 of Row 2
    expect(screen.getByTestId("1.0_userId_TestLibraryId2")).toHaveTextContent(
      "userId3"
    );
    //Subrow 2 of Row 2
    expect(screen.getByTestId("1.1_userId_TestLibraryId2")).toHaveTextContent(
      "userId1"
    );
    //Subrow 3 of Row 2
    expect(screen.getByTestId("1.2_userId_TestLibraryId2")).toHaveTextContent(
      "userId2"
    );
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

    useLibraryServiceMock.mockImplementation(() => {
      return mockLibraryServiceApi;
    });

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

    const expandButtonMockLibrary1 = screen.getByTestId(
      `expand-button-TestLibraryId1`
    );
    fireEvent.click(expandButtonMockLibrary1);

    const expandButtonMockLibrary2 = screen.getByTestId(
      `expand-button-TestLibraryId2`
    );
    fireEvent.click(expandButtonMockLibrary2);

    //Row 1
    expect(
      screen.getByTestId("0_cqlLibraryName_TestLibraryId1")
    ).toHaveTextContent("mockCqlLibrary1");
    //Subrow 1 of Row 1
    expect(screen.getByTestId("0.0_userId_TestLibraryId1")).toHaveTextContent(
      "userId3"
    );
    //Row 2
    expect(
      screen.getByTestId("1_cqlLibraryName_TestLibraryId2")
    ).toHaveTextContent("mockCqlLibrary2");
    //Subrow 1 of Row 2
    expect(screen.getByTestId("1.0_userId_TestLibraryId2")).toHaveTextContent(
      "userId3"
    );
    //Subrow 2 of Row 2
    expect(screen.getByTestId("1.1_userId_TestLibraryId2")).toHaveTextContent(
      "userId1"
    );
    //Subrow 3 of Row 2
    expect(screen.getByTestId("1.2_userId_TestLibraryId2")).toHaveTextContent(
      "userId2"
    );
  });
});
