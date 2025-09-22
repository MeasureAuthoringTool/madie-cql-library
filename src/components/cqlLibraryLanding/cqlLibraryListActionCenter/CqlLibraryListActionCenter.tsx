import React, { useCallback } from "react";
import DeleteAction from "./deleteAction/DeleteAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import ShareAction from "./shareAction/ShareAction";
import HistoryAction from "./historyAction/HistoryAction";
import { CqlLibrary } from "@madie/madie-models";
import {
  checkUserCanDelete,
  checkUserCanEdit,
  useFeatureFlags,
  useOktaTokens,
} from "@madie/madie-util";
import TransferAction from "./transferAction/TransferAction";

interface PropTypes {
  libraries: CqlLibrary[];
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
    libraries,
    setDeleteDraftDialog,
    setSelectedCqlLibrary,
    setCreateDraftDialog,
    createVersion,
    owners,
  } = props;
  const featureFlags = useFeatureFlags();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = libraries
    ? checkUserCanEdit(
        libraries[0]?.librarySet?.owner,
        libraries[0]?.librarySet?.acls
      )
    : false;
  const canDelete = libraries
    ? checkUserCanDelete(libraries[0]?.librarySet?.owner, libraries[0]?.draft)
    : false;

  function deleteLibrary() {
    setDeleteDraftDialog({
      open: true,
      cqlLibrary: libraries[0],
    });
  }
  function createDraft() {
    setCreateDraftDialog({
      open: true,
      cqlLibrary: libraries[0],
    });
  }

  const shareLibrary = useCallback(
    (option: string) => {
      props.setShareDialog({
        open: true,
        option,
      });
    },
    [props.setShareDialog]
  );

  const transferLibrary = useCallback(() => {
    if (props.libraries?.length > 0) {
      props.setTransferDialog({ open: true });
    }
  }, [props.libraries, props.setTransferDialog]);

  return (
    <div data-testid="action-center">
      <DeleteAction
        libraries={libraries}
        canEdit={canEdit}
        canDelete={canDelete}
        onClick={deleteLibrary}
      />

      <VersionAction
        libraries={libraries}
        canEdit={canEdit}
        onClick={createVersion}
      />

      <DraftAction
        libraries={libraries}
        canEdit={canEdit}
        onClick={createDraft}
      />
      {featureFlags?.LibraryHistory && (
        <HistoryAction libraries={libraries} onClick={() => {}} />
      )}
      <ShareAction
        libraries={libraries}
        canEdit={canEdit}
        onClick={shareLibrary}
        userName={userName}
        owners={owners}
      />
      {featureFlags?.TransferLibrary && (
        <TransferAction
          libraries={libraries}
          onClick={transferLibrary}
          activeTab={props?.activeTab}
        />
      )}
    </div>
  );
}
