import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CqlLibrary } from "@madie/madie-models";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";
import { CqlLibraryListActionCenter } from "./CqlLibraryListActionCenter";

jest.mock("@madie/madie-util", () => {
  return {
    checkUserCanEdit: jest.fn().mockReturnValue(true),
    checkUserCanDelete: jest.fn().mockReturnValue(true),
    useUserRoles: jest.fn().mockReturnValue({ roles: [], isAdmin: false }),
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

const selectedLibraries = [
  {
    id: "lib-1",
    cqlLibraryName: "Test Library",
    draft: true,
    model: "QI-Core v4.1.1",
    version: "0.0.001",
    librarySetId: "set-1",
    librarySet: {
      owner: "test-user",
      acls: [],
    },
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
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
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
});
