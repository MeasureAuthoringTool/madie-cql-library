import React, { useCallback } from "react";
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
}

export function CqlLibraryListActionCenter(props: PropTypes) {
  const {
    selectedLibraries,
    setDeleteDraftDialog,
    setCreateDraftDialog,
    createVersion,
    owners,
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
    (option: string) => {
      props.setShareDialog({
        open: true,
        option,
      });
    },
    [props]
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
        <HistoryAction libraries={selectedLibraries} onClick={() => {}} />
      )}
      <ShareAction
        libraries={selectedLibraries}
        canEdit={canEdit}
        onClick={shareLibrary}
        userName={userName}
        owners={owners}
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
