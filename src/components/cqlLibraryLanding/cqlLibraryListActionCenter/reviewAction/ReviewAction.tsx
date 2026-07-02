import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import ReviewIcon from "../../../../icons/ReviewIcon";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: () => void;
  canEdit: boolean;
}

export const SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS =
  "Select a library to update Review status";
export const REVIEW = "Review";

export default function ReviewAction(props: PropTypes) {
  const { libraries, canEdit, onClick } = props;
  const [disableReviewBtn, setDisableReviewBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(
    SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
  );
  const validateReviewActionState = useCallback(() => {
    const shouldEnableReview = libraries?.length === 1 && canEdit;

    setDisableReviewBtn(!shouldEnableReview);
    setTooltipMessage(
      shouldEnableReview ? REVIEW : SELECT_LIBRARY_TO_UPDATE_REVIEW_STATUS
    );
  }, [canEdit, libraries]);

  useEffect(() => {
    validateReviewActionState();
  }, [validateReviewActionState]);

  return (
    <Tooltip
      data-testid="review-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateReviewActionState}
      arrow
      placement="top"
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
          disabled={disableReviewBtn}
          data-testid="review-action-btn"
        >
          <ReviewIcon disabled={disableReviewBtn} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
