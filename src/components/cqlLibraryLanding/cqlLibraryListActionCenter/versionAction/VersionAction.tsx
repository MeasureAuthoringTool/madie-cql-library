import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { useFeatureFlags } from "@madie/madie-util";
import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select library to version";
export const VERSION_LIBRARY = "Version library";
const UNABLE_TO_VERSION =
  "Unable to version library. Locked while being edited by <harpID>.";

export default function VersionAction(props: PropTypes) {
  const { libraries, canEdit, onClick } = props;
  const [disableVersionBtn, setDisableVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const featureFlags = useFeatureFlags();

  const validateVersionActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableVersionBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (libraries?.length === 1 && libraries[0]?.draft && canEdit) {
      if (libraries[0]?.cqlLibraryLock?.lockedBy) {
        setTooltipMessage(
          UNABLE_TO_VERSION.replace(
            "<harpID>",
            libraries[0]?.cqlLibraryLock?.lockedBy
          )
        );
      } else {
        setDisableVersionBtn(false);
        setTooltipMessage(VERSION_LIBRARY);
      }
    }
  }, [libraries, canEdit]);

  useEffect(() => {
    validateVersionActionState();
  }, [libraries, validateVersionActionState]);

  return (
    <Tooltip
      data-testid="version-action-tooltip"
      title={tooltipMessage}
      arrow
      slotProps={{
        tooltip: {
          sx: {
            zIndex: 99,
            backgroundColor: "#333",
            "& .MuiTooltip-arrow": {
              color: "#333",
            },
          },
        },
      }}
    >
      <span>
        <IconButton
          onClick={onClick}
          disabled={disableVersionBtn}
          data-testid="version-action-btn"
        >
          <AccountTreeOutlinedIcon
            sx={disableVersionBtn ? { color: grey[500] } : { color: blue[500] }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
