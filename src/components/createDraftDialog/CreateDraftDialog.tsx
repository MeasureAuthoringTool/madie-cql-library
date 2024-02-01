import React from "react";
import "twin.macro";
import "styled-components/macro";
import { DialogContent, Box, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CqlLibrary } from "@madie/madie-models";
import { synchingEditorCqlContent } from "@madie/madie-editor";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import _ from "lodash";

interface CreateDraftDialogProps {
  open: boolean;
  onClose: Function;
  onSubmit: Function;
  cqlLibrary: CqlLibrary;
}

const CreatDraftDialog = ({
  open,
  onClose,
  onSubmit,
  cqlLibrary,
}: CreateDraftDialogProps) => {
  const formik = useFormik({
    initialValues: {
      cqlLibraryName: cqlLibrary?.cqlLibraryName,
    } as CqlLibrary,
    validationSchema: Yup.object().shape({
      cqlLibraryName: Yup.string()
        .max(64, "Library name cannot be more than 64 characters.")
        .required("Library name is required.")
        .matches(
          /^[A-Z][a-zA-Z0-9]*$/,
          "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
        ),
    }),
    enableReinitialize: true,
    onSubmit: async ({ cqlLibraryName }) => submitForm(cqlLibraryName),
  });

  const submitForm = async (cqlLibraryName: string) => {
    const cqlModelInfo: string[] = _.split(cqlLibrary?.model, " v", 2);
    const inSyncCql = await synchingEditorCqlContent(
      "",
      cqlLibrary?.cql,
      cqlLibraryName,
      cqlLibrary?.cqlLibraryName,
      cqlLibrary?.version,
      cqlModelInfo[0],
      cqlModelInfo[1],
      "draftDialog"
    );
    return onSubmit({ ...cqlLibrary, cqlLibraryName, cql: inSyncCql });
  };

  return (
    <MadieDialog
      form
      title="Create Draft"
      dialogProps={{
        onClose,
        open,
        onSubmit: formik.handleSubmit,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "create-draft-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "create-draft-continue-button",
        disabled: !formik.isValid,
        continueText: "Continue",
      }}
    >
      <DialogContent>
        <div tw="flex flex-row justify-end">
          <Typography tw="text-sm font-light">
            <span tw="text-red-550 mr-1">*</span>
            Required field
          </Typography>
        </div>
        <Box>
          <TextField
            {...formik.getFieldProps("cqlLibraryName")}
            placeholder="CQL Library Name"
            required
            label="CQL Library Name"
            id="cqlLibraryName"
            inputProps={{
              "data-testid": "cql-library-name-input",
              "aria-describedby": "cql-library-name-helper-text",
            }}
            data-testid="cql-library-name-field"
            size="small"
            error={
              formik.touched.cqlLibraryName &&
              Boolean(formik.errors.cqlLibraryName)
            }
            helperText={formik.errors["cqlLibraryName"]}
          />
        </Box>
      </DialogContent>
    </MadieDialog>
  );
};

export default CreatDraftDialog;
