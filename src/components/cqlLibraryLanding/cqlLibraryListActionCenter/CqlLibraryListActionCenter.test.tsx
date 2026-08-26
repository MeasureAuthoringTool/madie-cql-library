import * as mockLibraryActionStubs from "../../../__mocks__/libraryActionStubs";
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CqlLibrary, LibrarySet } from "@madie/madie-models";
// @ts-ignore
import { checkUserCanEdit, useFeatureFlags } from "@madie/madie-util";
import {
  REVIEW,
  SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS,
} from "./reviewAction/ReviewAction";
import { CqlLibraryListActionCenter } from "./CqlLibraryListActionCenter";
import { useUserRoles } from "../../../__mocks__/@madie/madie-util";

const ALL_REVIEWS_TAB = 3;

const mockCheckUserCanEdit = jest.fn();

jest.mock("@madie/madie-util", () => {
  return {
    ...mockLibraryActionStubs,
    checkUserCanEdit: jest.fn(),
    checkUserCanDelete: jest.fn().mockReturnValue(true),
    useUserRoles: jest
      .fn()
      .mockReturnValue({ roles: [], isAdmin: false, isReviewer: false }),
    useFeatureFlags: jest.fn().mockReturnValue({
      LibraryReviewStatus: true,
    }),
    useOktaTokens: jest.fn().mockReturnValue({
      getUserName: jest.fn().mockReturnValue("test-user"),
    }),
    useCqlLibraryServiceApi: jest.fn().mockReturnValue({
      getLibrariesByLibrarySetId: jest.fn().mockResolvedValue([]),
    }),
  };
});

const mockLibrarySet = {
  cmsId: "124",
  librarySetId: "1-2-3-4",
  owner: "test-user",
  acls: [],
} as unknown as LibrarySet;

const selectedLibraries = [
  {
    id: "lib-1",
    cqlLibraryName: "Test Library",
    draft: true,
    model: "QI-Core v4.1.1",
    version: "0.0.001",
    librarySetId: "set-1",
    librarySet: mockLibrarySet,
  },
] as CqlLibrary[];

const library2 = [
  {
    id: "lib-2",
    cqlLibraryName: "Other Library",
    draft: true,
    model: "QI-Core v4.1.1",
    version: "0.0.001",
    librarySetId: "set-1",
    librarySet: mockLibrarySet,
  },
] as CqlLibrary[];

const defaultProps = {
  selectedLibraries,
  setDeleteDraftDialog: jest.fn(),
  setSelectedCqlLibrary: jest.fn(),
  setCreateDraftDialog: jest.fn(),
  setShareDialog: jest.fn(),
  createVersion: jest.fn(),
  owners: ["test-user"],
  activeTab: 0,
  setTransferDialog: jest.fn(),
  openLibraryHistoryDialog: jest.fn(),
  setCompareVersionsDialog: jest.fn(),
  setReviewDialog: jest.fn(),
};

describe("CqlLibraryListActionCenter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
    (checkUserCanEdit as jest.Mock).mockImplementation(mockCheckUserCanEdit);
    // jest.clearAllMocks() keeps configured return values, so reset the default
    // here to keep each test independent of the ones before it.
    mockCheckUserCanEdit.mockReturnValue(true);
  });

  it("renders ReviewAction when LibraryReviewStatus feature flag is enabled", () => {
    render(<CqlLibraryListActionCenter {...defaultProps} />);

    expect(screen.getByTestId("review-action-btn")).toBeInTheDocument();
  });

  it("does not render ReviewAction when LibraryReviewStatus feature flag is disabled", () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: false,
    });

    render(<CqlLibraryListActionCenter {...defaultProps} />);

    expect(screen.queryByTestId("review-action-btn")).not.toBeInTheDocument();
  });

  it("fires delete, history, transfer and version callbacks", async () => {
    const setDeleteDraftDialog = jest.fn();
    const openLibraryHistoryDialog = jest.fn();
    const setTransferDialog = jest.fn();
    const createVersion = jest.fn();

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        setDeleteDraftDialog={setDeleteDraftDialog}
        openLibraryHistoryDialog={openLibraryHistoryDialog}
        setTransferDialog={setTransferDialog}
        createVersion={createVersion}
      />
    );

    userEvent.click(screen.getByTestId("delete-action-btn"));
    expect(setDeleteDraftDialog).toHaveBeenCalledWith({
      open: true,
      cqlLibrary: selectedLibraries[0],
    });

    userEvent.click(screen.getByTestId("library-history-action-btn"));
    expect(openLibraryHistoryDialog).toHaveBeenCalled();

    userEvent.click(screen.getByTestId("transfer-action-btn"));
    expect(setTransferDialog).toHaveBeenCalledWith({ open: true });

    userEvent.click(screen.getByTestId("version-action-btn"));
    expect(createVersion).toHaveBeenCalled();
  });

  it("fires draft callback for versioned library", async () => {
    const versionedLibrary = {
      ...selectedLibraries[0],
      draft: false,
      id: "lib-2",
    } as CqlLibrary;
    const setCreateDraftDialog = jest.fn();

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        selectedLibraries={[versionedLibrary]}
        setCreateDraftDialog={setCreateDraftDialog}
      />
    );

    userEvent.click(screen.getByTestId("draft-action-btn"));
    expect(setCreateDraftDialog).toHaveBeenCalledWith({
      open: true,
      cqlLibrary: versionedLibrary,
    });
  });

  it("fires review callback when one library is selected", () => {
    const setReviewDialog = jest.fn();

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        setReviewDialog={setReviewDialog}
      />
    );

    userEvent.click(screen.getByTestId("review-action-btn"));
    expect(setReviewDialog).toHaveBeenCalledWith({
      open: true,
      libraryId: selectedLibraries[0].id,
    });
  });

  it("does not fire review callback when no libraries are selected", () => {
    const setReviewDialog = jest.fn();

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        selectedLibraries={[]}
        setReviewDialog={setReviewDialog}
      />
    );

    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
    expect(setReviewDialog).not.toHaveBeenCalled();
  });

  it("fires share callback and compare versions callback", async () => {
    const setShareDialog = jest.fn();
    const setCompareVersionsDialog = jest.fn();
    const twoLibraries = [
      selectedLibraries[0],
      {
        ...selectedLibraries[0],
        id: "lib-3",
        version: "1.0.001",
      },
    ] as CqlLibrary[];

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        selectedLibraries={twoLibraries}
        setShareDialog={setShareDialog}
        setCompareVersionsDialog={setCompareVersionsDialog}
      />
    );

    userEvent.click(screen.getByTestId("share-action-btn"));
    userEvent.click(screen.getByRole("menuitem", { name: "Share With" }));
    expect(setShareDialog).toHaveBeenCalledWith({
      open: true,
      option: "Share With",
    });

    userEvent.click(screen.getByTestId("compare-versions-action-btn"));
    expect(setCompareVersionsDialog).toHaveBeenCalledWith(true);
  });

  describe.each([
    ["My Libraries", 0],
    ["Shared Libraries", 1],
    ["All Libraries", 2],
  ])("%s tab", (_tabName, activeTab) => {
    beforeEach(() => {
      // Owned or shared with "test-user", mirroring checkUserCanEdit.
      mockCheckUserCanEdit.mockImplementation(
        (owner: string, acls: any[]) =>
          owner === "test-user" ||
          !!acls?.some(
            (acl) =>
              acl?.userId === "test-user" && acl?.roles?.includes("SHARED_WITH")
          )
      );
    });

    it("enables the review action for a non reviewer who owns the selected library", async () => {
      render(<CqlLibraryListActionCenter {...defaultProps} />);

      const reviewButton = await screen.findByTestId("review-action-btn");
      await waitFor(() => {
        expect(reviewButton).toBeEnabled();
      });
      expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
        "aria-label",
        REVIEW
      );
    });

    it("enables the review action for a non reviewer the library is shared with", async () => {
      const sharedLibrary = {
        ...selectedLibraries[0],
        librarySet: {
          ...mockLibrarySet,
          owner: "another user",
          acls: [{ userId: "test-user", roles: ["SHARED_WITH"] }],
        },
      } as unknown as CqlLibrary;

      render(
        <CqlLibraryListActionCenter
          {...defaultProps}
          activeTab={activeTab}
          selectedLibraries={[sharedLibrary]}
        />
      );

      const reviewButton = await screen.findByTestId("review-action-btn");
      await waitFor(() => {
        expect(reviewButton).toBeEnabled();
      });
    });

    it("disables the review action when the selected library is neither owned nor shared", async () => {
      const otherLibrary = {
        ...selectedLibraries[0],
        librarySet: { ...mockLibrarySet, owner: "another user", acls: [] },
      } as unknown as CqlLibrary;

      render(
        <CqlLibraryListActionCenter
          {...defaultProps}
          activeTab={activeTab}
          selectedLibraries={[otherLibrary]}
        />
      );

      const reviewButton = await screen.findByTestId("review-action-btn");
      await waitFor(() => {
        expect(reviewButton).toBeDisabled();
      });
      expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
        "aria-label",
        SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
      );
    });
  });

  it("should enable the review action on the All Reviews tab when exactly one library is selected, even without edit access", async () => {
    mockCheckUserCanEdit.mockReturnValue(false);
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: ["MADiE-Reviewer"],
      isAdmin: false,
      isReviewer: true,
    });

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        activeTab={ALL_REVIEWS_TAB}
      />
    );

    const reviewButton = await screen.findByTestId("review-action-btn");
    await waitFor(() => {
      expect(reviewButton).toBeEnabled();
    });
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      REVIEW
    );
  });

  it("should disable the review action on the All Reviews tab when no libraries are selected", async () => {
    mockCheckUserCanEdit.mockReturnValue(false);
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: ["MADiE-Reviewer"],
      isAdmin: false,
      isReviewer: true,
    });

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        selectedLibraries={[]}
        activeTab={ALL_REVIEWS_TAB}
      />
    );

    const reviewButton = await screen.findByTestId("review-action-btn");
    await waitFor(() => {
      expect(reviewButton).toBeDisabled();
    });
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("should disable the review action on the All Reviews tab when more than one library is selected", async () => {
    mockCheckUserCanEdit.mockReturnValue(false);
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: ["MADiE-Reviewer"],
      isAdmin: false,
      isReviewer: true,
    });

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        selectedLibraries={[...selectedLibraries, ...library2]}
        activeTab={ALL_REVIEWS_TAB}
      />
    );

    const reviewButton = await screen.findByTestId("review-action-btn");
    await waitFor(() => {
      expect(reviewButton).toBeDisabled();
    });
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("should disable the review action on the All Reviews tab when the user is not a reviewer and cannot edit the library", async () => {
    mockCheckUserCanEdit.mockReturnValue(false);
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: ["MADiE-Reviewer"],
      isAdmin: false,
      isReviewer: false,
    });

    render(
      <CqlLibraryListActionCenter
        {...defaultProps}
        activeTab={ALL_REVIEWS_TAB}
      />
    );

    const reviewButton = await screen.findByTestId("review-action-btn");
    await waitFor(() => {
      expect(reviewButton).toBeDisabled();
    });
  });
});
