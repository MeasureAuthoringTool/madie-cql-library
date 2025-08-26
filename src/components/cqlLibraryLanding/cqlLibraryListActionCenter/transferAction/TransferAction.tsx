import React, { useEffect, useState, useCallback } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import { checkUserCanEdit } from "@madie/madie-util";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  activeTab: number;
}

const isOwnerOfSelectedLibrary = (libraries) => {
  return (
    libraries &&
    libraries.every((library) => {
      return checkUserCanEdit(library?.librarySet?.owner, []);
    })
  );
};

export const NOTHING_SELECTED = "Select a library to transfer";
export const CANNOT_TRANSFER = "You cannot transfer a library you do not own";
export const MORE_THAN_ONE_NOT_OWNED =
  "You cannot transfer a library you do not own, you have selected at least 1 library that you do not own";
export const TRANSFER = "Transfer";

export default function TransferAction(props: PropTypes) {
  const { libraries, activeTab } = props;
  const [disableTransferBtn, setDisableTransferBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateTransferActionState = useCallback(() => {
    setDisableTransferBtn(false);
    setTooltipMessage(TRANSFER);
    if (libraries?.length === 0) {
      setDisableTransferBtn(true);
      setTooltipMessage(NOTHING_SELECTED);
    }
    if (activeTab === 1) {
      setTooltipMessage(CANNOT_TRANSFER);
      setDisableTransferBtn(true);
    } else if (activeTab === 2) {
      if (!isOwnerOfSelectedLibrary(libraries)) {
        setTooltipMessage(MORE_THAN_ONE_NOT_OWNED);
        setDisableTransferBtn(true);
      }
    }
  }, [libraries, activeTab]);

  useEffect(() => {
    validateTransferActionState();
  }, [libraries, validateTransferActionState, activeTab]);

  return (
    <Tooltip data-testid="transfer-action-tooltip" title={tooltipMessage} arrow>
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableTransferBtn}
          data-testid="transfer-action-btn"
        >
          <SwapVertOutlinedIcon style={{ transform: "rotate(90deg)" }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
