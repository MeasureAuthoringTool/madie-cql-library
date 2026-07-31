import React from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { DialogContent, Typography } from "@mui/material";
import { useOwnerName } from "@madie/madie-util";

const LibraryLockedPopup = ({
  libraryLockedBy,
  lockedLibraryPopupOpen,
  setLockedLibraryPopupOpen,
}) => {
  const displayName = useOwnerName(libraryLockedBy);
  const hasName = displayName !== libraryLockedBy;
  return (
    <MadieDialog
      title="Library currently In-Use"
      dialogProps={{
        onClose: () => setLockedLibraryPopupOpen(false),
        open: lockedLibraryPopupOpen,
      }}
      cancelButtonProps={{
        class: "qpp-c-button qpp-c-button--outline-filled",
        cancelText: "Close",
        "data-testid": "library-locked-popup-close-button",
        maxWidth: "sm",
      }}
      continueButtonProps={""}
    >
      <DialogContent>
        <div data-testid="library-locked-popup-message">
          <Typography>
            <div>
              This library is currently being edited by{" "}
              {hasName
                ? `${displayName} (${libraryLockedBy})`
                : `${libraryLockedBy}`}
              .<br></br> You will be unable to make changes at this time.
            </div>
          </Typography>
        </div>
      </DialogContent>
    </MadieDialog>
  );
};

export default LibraryLockedPopup;
