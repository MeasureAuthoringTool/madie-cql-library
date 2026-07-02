import React, { useCallback, useState } from "react";
import DeleteAction from "./deleteAction/DeleteAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import ShareAction from "./shareAction/ShareAction";
import HistoryAction from "./historyAction/HistoryAction";
import CompareVersionsAction from "./compareVersionsAction/CompareVersionsAction";
import { CqlLibrary } from "@madie/madie-models";
import {
  checkUserCanEdit,
  FeatureFlags,
  useFeatureFlags,
  useOktaTokens,
} from "@madie/madie-util";
import TransferAction from "./transferAction/TransferAction";
import ReviewAction from "./reviewAction/ReviewAction";

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
  } = props;
  const featureFlags: FeatureFlags = useFeatureFlags();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
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
    // Review click handling will be implemented in a follow-up story.
  }, []);

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
      <HistoryAction
        libraries={selectedLibraries}
        onClick={openLibraryHistoryDialog}
      />
      <TransferAction
        libraries={selectedLibraries}
        onClick={transferLibrary}
        activeTab={activeTab}
      />
      <CompareVersionsAction
        libraries={selectedLibraries}
        onClick={compareVersions}
      />
      {featureFlags?.LibraryReviewStatus && (
        <ReviewAction
          libraries={selectedLibraries}
          onClick={reviewLibrary}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
