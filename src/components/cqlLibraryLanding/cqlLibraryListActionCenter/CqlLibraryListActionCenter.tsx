import React, { useCallback, useState } from "react";
import DeleteAction from "./deleteAction/DeleteAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import ShareAction from "./shareAction/ShareAction";
import HistoryAction from "./historyAction/HistoryAction";
import { CqlLibrary } from "@madie/madie-models";
import {
  checkUserCanEdit,
  useFeatureFlags,
  useOktaTokens,
} from "@madie/madie-util";
import TransferAction from "./transferAction/TransferAction";

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
}

export function CqlLibraryListActionCenter(props: PropTypes) {
  const {
    selectedLibraries,
    setDeleteDraftDialog,
    setCreateDraftDialog,
    createVersion,
    owners,
    openLibraryHistoryDialog,
  } = props;
  const featureFlags = useFeatureFlags();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = selectedLibraries
    ? checkUserCanEdit(
        selectedLibraries[0]?.librarySet?.owner,
        selectedLibraries[0]?.librarySet?.acls
      )
    : false;
  const [isSharedWithUser, setIsSharedWithUser] = useState<boolean>(true);

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
        actionType === "Unshare" && props.activeTab === 1
          ? "UnshareFromMe"
          : actionType;

      props.setShareDialog({ open: true, option: shareOption });
    },
    [props.setShareDialog, props.activeTab]
  );

  const transferLibrary = useCallback(() => {
    if (selectedLibraries?.length > 0) {
      props.setTransferDialog({ open: true });
    }
  }, [selectedLibraries?.length, props]);

  return (
    <div data-testid="action-center">
      <DeleteAction
        onClick={deleteLibrary}
        selectedLibraries={selectedLibraries}
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
      {featureFlags?.LibraryHistory && (
        <HistoryAction
          libraries={selectedLibraries}
          onClick={openLibraryHistoryDialog}
        />
      )}
      <ShareAction
        libraries={selectedLibraries}
        canEdit={canEdit}
        onClick={shareLibrary}
        userName={userName}
        owners={owners}
        isSharedWithUser={isSharedWithUser}
        activeTab={props?.activeTab}
      />
      {featureFlags?.TransferLibrary && (
        <TransferAction
          libraries={selectedLibraries}
          onClick={transferLibrary}
          activeTab={props?.activeTab}
        />
      )}
    </div>
  );
}
