import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select library to version";
export const VERSION_LIBRARY = "Version library";

export default function VersionAction(props: PropTypes) {
  const { libraries, canEdit, onClick } = props;
  const [disableVersionBtn, setDisableVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateVersionActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableVersionBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (libraries?.length === 1 && libraries[0]?.draft && canEdit) {
      setDisableVersionBtn(false);
      setTooltipMessage(VERSION_LIBRARY);
    }
  }, [libraries, canEdit]);

  useEffect(() => {
    validateVersionActionState();
  }, [libraries, validateVersionActionState]);

  return (
    <Tooltip
      data-testid="version-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateVersionActionState}
      arrow
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
