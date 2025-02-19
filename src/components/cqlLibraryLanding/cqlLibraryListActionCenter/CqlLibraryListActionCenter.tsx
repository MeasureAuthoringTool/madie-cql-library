import React, { useEffect } from "react";
import { Button, Grid } from "@material-ui/core";
import DeleteAction from "./deleteAction/DeleteAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import { CqlLibrary } from "@madie/madie-models";

import {
  checkUserCanDelete,
  checkUserCanEdit,
  useFeatureFlags,
} from "@madie/madie-util";

interface PropTypes {
  libraries: CqlLibrary[];
  setDeleteDraftDialog: (value: any) => void;
}

export function CqlLibraryListActionCenter(props: PropTypes) {
  const { libraries, setDeleteDraftDialog } = props;

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

  useEffect(() => {}, []);
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
        onClick={() => {}}
      />

      <DraftAction libraries={libraries} canEdit={canEdit} onClick={() => {}} />
    </div>
  );
}
