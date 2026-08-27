import React, { useCallback, useState } from "react";
import DeleteAction from "./deleteAction/DeleteAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import ShareAction from "./shareAction/ShareAction";
import { CqlLibrary } from "@madie/madie-models";
import {
  checkUserCanEdit,
  FeatureFlags,
  LibraryCompareVersionsAction,
  LibraryHistoryAction,
  LibraryTransferAction,
  useFeatureFlags,
  useOktaTokens,
  useUserRoles,
} from "@madie/madie-util";
import ReviewAction from "./reviewAction/ReviewAction";

const ALL_REVIEWS_TAB = 3;

interface PropTypes {
  selectedLibraries: CqlLibrary[];
  setDeleteDraftDialog: (value: any) => void;
  setSelectedCqlLibrary: (value: any) => void;
  setCreateDraftDialog: (value: any) => void;
  setShareDialog: (value: any) => void;
  createVersion: () => void;
  owners: string[];
  activeTab: number;
  setTransferDialog: (value: any) => void;
  openLibraryHistoryDialog: () => void;
  setCompareVersionsDialog: any;
  setReviewDialog: (value: any) => void;
}

export function CqlLibraryListActionCenter(props: PropTypes) {
  const {
    selectedLibraries,
    setDeleteDraftDialog,
    setCreateDraftDialog,
    createVersion,
    owners,
    openLibraryHistoryDialog,
    activeTab,
    setShareDialog,
    setTransferDialog,
    setCompareVersionsDialog,
    setReviewDialog,
  } = props;
  const featureFlags: FeatureFlags = useFeatureFlags();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const userRoles = useUserRoles();
  const canEdit = selectedLibraries
    ? checkUserCanEdit(
        selectedLibraries[0]?.librarySet?.owner,
        selectedLibraries[0]?.librarySet?.acls
      )
    : false;
  const [isSharedWithUser] = useState<boolean>(true);

  function deleteLibrary() {
    setDeleteDraftDialog({
      open: true,
      cqlLibrary: selectedLibraries[0],
    });
  }
  function createDraft() {
    setCreateDraftDialog({
      open: true,
      cqlLibrary: selectedLibraries[0],
    });
  }

  const shareLibrary = useCallback(
    (actionType: string) => {
      const shareOption =
        actionType === "Unshare" && activeTab === 1
          ? "UnshareFromMe"
          : actionType;

      setShareDialog({ open: true, option: shareOption });
    },
    [setShareDialog, activeTab]
  );

  const transferLibrary = useCallback(() => {
    if (selectedLibraries?.length > 0) {
      setTransferDialog({ open: true });
    }
  }, [selectedLibraries?.length, setTransferDialog]);

  const compareVersions = useCallback(() => {
    if (selectedLibraries?.length === 2) {
      setCompareVersionsDialog(true);
    }
  }, [selectedLibraries?.length, setCompareVersionsDialog]);

  const reviewLibrary = useCallback(() => {
    if (selectedLibraries?.length === 1) {
      setReviewDialog?.({
        open: true,
        libraryId: selectedLibraries[0]?.id,
      });
    }
  }, [selectedLibraries, setReviewDialog]);

  const canReview =
    (activeTab === ALL_REVIEWS_TAB && !!userRoles?.isReviewer) || canEdit;

  const PipeSeparator = () => (
    <span
      aria-hidden="true"
      style={{ color: "#8C8C8C", display: "inline-flex", alignItems: "center" }}
    >
      |
    </span>
  );

  return (
    <div data-testid="action-center">
      <DeleteAction
        onClick={deleteLibrary}
        selectedLibraries={selectedLibraries}
      />
      <ShareAction
        libraries={selectedLibraries}
        canEdit={canEdit}
        onClick={shareLibrary}
        userName={userName}
        owners={owners}
        isSharedWithUser={isSharedWithUser}
        activeTab={activeTab}
      />
      <LibraryTransferAction
        libraries={selectedLibraries}
        onClick={transferLibrary}
        activeTab={activeTab}
      />

      <PipeSeparator />

      <VersionAction
        libraries={selectedLibraries}
        canEdit={canEdit}
        onClick={createVersion}
      />

      <DraftAction
        libraries={selectedLibraries}
        canEdit={canEdit}
        onClick={createDraft}
      />

      <PipeSeparator />

      <LibraryHistoryAction
        libraries={selectedLibraries}
        onClick={openLibraryHistoryDialog}
      />
      <LibraryCompareVersionsAction
        libraries={selectedLibraries}
        onClick={compareVersions}
      />
      {featureFlags?.LibraryReviewStatus && (
        <>
          <PipeSeparator />
          <ReviewAction
            libraries={selectedLibraries}
            onClick={reviewLibrary}
            canReview={canReview}
          />
        </>
      )}
    </div>
  );
}
