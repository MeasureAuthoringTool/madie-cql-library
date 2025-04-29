import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary } from "@madie/madie-models";
import ShareIcon from "../../../common/ShareIcon";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: (option: string) => void;
  canEdit: boolean;
  userName: string;
  owners: string[];
}

export const NOTHING_SELECTED = "Select a library to share/unshare";
export const INVALID_SHARE_LIBRARY =
  "You cannot share/unshare a library you do not own";
export const VALID_SHARE_LIBRARY = "Share/Unshare";

export enum SharedOptions {
  SHARE_WITH = "Share With",
  UNSHARE = "Unshare",
}

const options = [SharedOptions.SHARE_WITH, SharedOptions.UNSHARE];

export default function ShareAction(props: PropTypes) {
  const { libraries, canEdit, userName } = props;
  const [disableShareBtn, setDisableShareBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const validateShareActionState = useCallback(() => {
    setDisableShareBtn(true);
    if (libraries?.length === 0 || props.owners?.length === 0) {
      setTooltipMessage(NOTHING_SELECTED);
    } else if (
      props.owners?.length > 1 ||
      (props.owners?.length == 1 && props.owners[0] != userName)
    ) {
      setTooltipMessage(INVALID_SHARE_LIBRARY);
    } else {
      setTooltipMessage(VALID_SHARE_LIBRARY);
      setDisableShareBtn(false);
    }
  }, [libraries, canEdit, props.owners]);

  useEffect(() => {
    validateShareActionState();
  }, [libraries, validateShareActionState]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setTooltipMessage(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (option: string) => {
    handleClose();

    props.onClick(option);
  };

  return (
    <Tooltip
      data-testid="share-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateShareActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={handleClick}
          disabled={disableShareBtn}
          data-testid="share-action-btn"
        >
          <ShareIcon color={disableShareBtn ? "#8C8C8C" : "#0073C8"} />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          data-testid="share-menu"
        >
          {options.map((option) => (
            <MenuItem
              data-testid={`${option}-option`}
              key={option}
              onClick={() => handleMenuItemClick(option)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </span>
    </Tooltip>
  );
}
