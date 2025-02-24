import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { grey, red } from "@mui/material/colors";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const NOTHING_SELECTED = "Select library to delete";
export const DEL_LIBRARY = "Delete library";

export default function DeleteAction(props: PropTypes) {
  const { libraries, canEdit, canDelete } = props;
  const [disableDeleteBtn, setDisableDeleteBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const validateDeleteActionState = useCallback(() => {
    setDisableDeleteBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (libraries?.length === 1 && canDelete) {
      setDisableDeleteBtn(false);
      setTooltipMessage(DEL_LIBRARY);
    }
  }, [libraries, canEdit]);

  useEffect(() => {
    validateDeleteActionState();
  }, [libraries, validateDeleteActionState]);

  return (
    <Tooltip
      data-testid="delete-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateDeleteActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={() => props.onClick()}
          disabled={disableDeleteBtn}
          data-testid="delete-action-btn"
        >
          <DeleteOutlinedIcon
            sx={disableDeleteBtn ? { color: grey[500] } : { color: red[500] }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
