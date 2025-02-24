import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
// import useCqlLibraryServiceApi from "../../../../api/useCqlLibraryServiceApi";
import { Toast } from "@madie/madie-design-system/dist/react";

import { grey, blue } from "@mui/material/colors";
import _ from "lodash";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select library to draft";
export const DRAFT_LIBRARY = "Draft library";
export const LOOKUP_ERROR = "There was an error checking draftability. ";

export default function DraftAction(props: PropTypes) {
  const { libraries, canEdit } = props;
  const [disableDraftBtn, setDisableDraftBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  // const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };

  const validateDraftActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableDraftBtn(true);
    setTooltipMessage(NOTHING_SELECTED);

    if (libraries?.length === 1 && !libraries[0]?.draft && canEdit) {
      setDisableDraftBtn(false);
      setTooltipMessage(DRAFT_LIBRARY);
    } else if (toastMessage) {
      setTooltipMessage(LOOKUP_ERROR);
    }
  }, [libraries, canEdit]);

  useEffect(() => {
    validateDraftActionState();
  }, [libraries, validateDraftActionState]);

  return (
    <Tooltip
      data-testid="draft-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateDraftActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableDraftBtn}
          data-testid="draft-action-btn"
        >
          <EditCalendarOutlinedIcon
            sx={disableDraftBtn ? { color: grey[500] } : { color: blue[500] }}
          />
          <Toast
            toastKey="draft-button-error-toast"
            toastType="danger"
            testId="draft-button-error-toast-text"
            open={toastOpen}
            message={toastMessage}
            onClose={onToastClose}
            autoHideDuration={6000}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
