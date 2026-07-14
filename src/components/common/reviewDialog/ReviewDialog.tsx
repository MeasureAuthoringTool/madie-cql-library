import React, { useState } from "react";
import { CqlLibrary } from "@madie/madie-models";
import {
  MadieDialog,
  RichTextEditor,
} from "@madie/madie-design-system/dist/react";
import { Divider, FormControlLabel, Switch } from "@mui/material";

interface ReviewDialogProps {
  open: boolean;
  library?: CqlLibrary;
  onClose: () => void;
}

export default function ReviewDialog({
  open,
  library,
  onClose,
}: ReviewDialogProps) {
  const [markAsReady, setMarkAsReady] = useState(false);
  const [comments, setComments] = useState("");

  // useEffect(() => {
  //   if (open) {
  //     // TODO: Once the library model includes reviewStatus enum, update this logic
  //     // to check if library?.reviewStatus === ReviewStatus.READY (or equivalent)
  //     // For now, we default to false and clear comments
  //     const isReady = library?.reviewStatus === "READY";
  //     setMarkAsReady(isReady);
  //     setComments("");
  //   }
  // }, [open, library?.reviewStatus]);

  const isSaveDisabled = !markAsReady;

  return (
    <MadieDialog
      title="Mark Library Ready for Review"
      dialogProps={{
        open,
        onClose,
        maxWidth: "md",
        fullWidth: true,
        "data-testid": "review-dialog",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Cancel",
        onClick: onClose,
        "data-testid": "review-dialog-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        continueText: "Save",
        disabled: isSaveDisabled,
        onClick: () => {
          // Save behavior is intentionally out of scope for this story.
        },
        "data-testid": "review-dialog-save-button",
      }}
    >
      <div data-testid="review-dialog-content">
        <Divider sx={{ mb: 2 }} />
        <FormControlLabel
          label="Mark as Ready"
          control={
            <Switch
              data-testid="review-dialog-mark-ready-switch"
              checked={markAsReady}
              onChange={(event) => setMarkAsReady(event.target.checked)}
              slotProps={{
                input: {
                  "aria-label": "Mark as Ready",
                },
              }}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#0073C8",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#0073C8",
                },
              }}
            />
          }
          sx={{
            "& .MuiFormControlLabel-label": {
              color: "#515151 !important",
            },
          }}
        />
        <div style={{ marginTop: 16 }}>
          <RichTextEditor
            id="review-comments"
            name="reviewComments"
            label="Comments"
            content={comments}
            onChange={(value: string) => setComments(value)}
          />
        </div>
        <Divider sx={{ mt: 2 }} />
      </div>
    </MadieDialog>
  );
}
