import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { CqlLibrary, Model } from "@madie/madie-models";
import { Toast } from "@madie/madie-design-system/dist/react";
import { useCqlLibraryServiceApi } from "@madie/madie-util";
import { ClipboardPen } from "lucide-react";

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
export const CANNOT_DRAFT_LIBRARY_WITH_600 =
  "You cannot draft a 4.1.1 library when a 6.0.0 version is available";

export default function DraftAction(props: PropTypes) {
  const { libraries, canEdit } = props;
  const [disableDraftBtn, setDisableDraftBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };

  const [disableDraftHasQiCore600, setDisableDraftHasQiCore600] =
    useState(false);
  const isQiCore411AndHasQiCore600Library = async () => {
    let shouldEnableDraft = true;
    if (libraries[0]?.model === Model.QICORE) {
      const promiseResults = await Promise.allSettled([
        cqlLibraryServiceApi.getLibrariesByLibrarySetId(
          libraries[0]?.librarySetId,
          true,
          null
        ),
      ]);

      // Extract fulfilled values and flatten the array
      const fetchedLibraries: CqlLibrary[] = promiseResults
        .filter((result) => result.status === "fulfilled")
        .flatMap(
          (result) =>
            (result as PromiseFulfilledResult<CqlLibrary[]>).value || []
        )
        .filter(Boolean); // Remove any null/undefined

      const libs = fetchedLibraries?.filter(
        (library) =>
          library.id !== libraries[0].id && library.model === Model.QICORE_6_0_0
      );
      shouldEnableDraft = libs && libs.length > 0 ? false : true;
    }

    return shouldEnableDraft;
  };
  useEffect(() => {
    const checkDraft = async () => {
      const shouldEnableDraft = await isQiCore411AndHasQiCore600Library();
      setDisableDraftHasQiCore600(!shouldEnableDraft);
      if (!shouldEnableDraft) {
        setTooltipMessage(CANNOT_DRAFT_LIBRARY_WITH_600);
      }
    };
    checkDraft();
  }, [libraries?.[0]]);

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
          onClick={props.onClick}
          disabled={disableDraftBtn || disableDraftHasQiCore600}
          data-testid="draft-action-btn"
        >
          <ClipboardPen
            size={20}
            color={
              disableDraftBtn || disableDraftHasQiCore600
                ? grey[500]
                : blue[500]
            }
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
