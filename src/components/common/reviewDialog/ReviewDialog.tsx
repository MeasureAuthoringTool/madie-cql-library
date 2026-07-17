import React, { useEffect, useMemo, useRef } from "react";
import { useFormik } from "formik";
import { CqlLibrary, ReviewStatus } from "@madie/madie-models";
import {
  MadieDialog,
  RichTextEditor,
} from "@madie/madie-design-system/dist/react";
import { Divider, FormControlLabel, Switch } from "@mui/material";
import { useCqlLibraryServiceApi } from "@madie/madie-util";

interface ReviewDialogProps {
  open: boolean;
  library?: CqlLibrary;
  onClose: () => void;
}

const EMPTY_REVIEW_COMMENT = "<p></p>";

export default function ReviewDialog({
  open,
  library,
  onClose,
}: ReviewDialogProps) {
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  const initialValues = useMemo(
    () => ({
      markAsReady: library?.review?.status === ReviewStatus.READY_FOR_REVIEW,
      comments: library?.review?.comment ?? EMPTY_REVIEW_COMMENT,
    }),
    [library?.review?.status, library?.review?.comment]
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!library?.id) {
        return;
      }

      const updatedLibrary: CqlLibrary = {
        ...library,
        review: {
          status: values.markAsReady
            ? ReviewStatus.READY_FOR_REVIEW
            : ReviewStatus.NOT_READY_FOR_REVIEW,
          comment: values.comments || EMPTY_REVIEW_COMMENT,
        },
      };

      await cqlLibraryServiceApi.updateCqlLibrary(updatedLibrary);
      onClose();
    },
  });
  const { resetForm } = formik;

  useEffect(() => {
    if (open) {
      resetForm({ values: initialValues });
    }
  }, [open, initialValues, resetForm]);

  const isSaveDisabled = !library?.id || !formik.dirty;

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
        onClick: formik.submitForm,
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
              checked={formik.values.markAsReady}
              onChange={(event) =>
                formik.setFieldValue("markAsReady", event.target.checked)
              }
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
            content={formik.values.comments}
            onChange={(value: string) =>
              formik.setFieldValue("comments", value)
            }
          />
        </div>
        <Divider sx={{ mt: 2 }} />
      </div>
    </MadieDialog>
  );
}
