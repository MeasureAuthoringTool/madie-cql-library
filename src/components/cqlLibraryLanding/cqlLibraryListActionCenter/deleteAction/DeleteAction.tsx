import React from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { checkUserCanDelete } from "@madie/madie-util";
import { CqlLibrary } from "@madie/madie-models";

interface PropTypes {
  onClick: () => void;
  selectedLibraries?: CqlLibrary[];
}

export const NOTHING_SELECTED = "Select library to delete";
export const DEL_LIBRARY = "Delete library";
export const LOCKED_LIBRARY_PREFIX =
  "Unable to delete library.  Locked while being edited by ";
export const PERMISSION_DENIED =
  "You do not have permissions to delete this library";

export default function DeleteAction(props: PropTypes) {
  const { selectedLibraries } = props;

  const exactlyOneSelected = selectedLibraries?.length === 1;
  const selectedLibrary = exactlyOneSelected
    ? selectedLibraries?.[0]
    : undefined;
  const lockedBy = selectedLibrary?.cqlLibraryLock?.lockedBy;
  const isLocked = !!lockedBy;
  const hasPermission =
    !!selectedLibrary &&
    checkUserCanDelete(
      selectedLibrary?.librarySet?.owner,
      selectedLibrary?.draft
    );
  const canDelete =
    !!selectedLibrary && exactlyOneSelected && hasPermission && !isLocked;

  // tooltip precedence:
  // 1. Nothing selected (none or multiple)
  // 2. Permission denied (one selected, not locked, lacks permission)
  // 3. Locked (one selected, has permission, locked)
  // 4. Deletable
  let tooltipMessage = NOTHING_SELECTED;
  if (exactlyOneSelected) {
    if (!hasPermission) {
      tooltipMessage = PERMISSION_DENIED;
    } else if (isLocked) {
      tooltipMessage = `${LOCKED_LIBRARY_PREFIX}${lockedBy}`;
    } else if (canDelete) {
      tooltipMessage = DEL_LIBRARY;
    }
  }

  const disabled = !canDelete;

  return (
    <Tooltip data-testid="delete-action-tooltip" title={tooltipMessage} arrow>
      <span>
        <IconButton
          onClick={() => props.onClick()}
          disabled={disabled}
          data-testid="delete-action-btn"
          className="DeleteClass"
        >
          <DeleteOutlinedIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
