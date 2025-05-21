import React from "react";
import "twin.macro";
import "styled-components/macro";
import { DialogContent, Box, MenuItem, Typography } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CqlLibrary, Model } from "@madie/madie-models";
import {
  MadieDialog,
  Select,
  TextField,
} from "@madie/madie-design-system/dist/react";

interface CreateDraftDialogProps {
  open: boolean;
  onClose: Function;
  onSubmit: Function;
  cqlLibrary: CqlLibrary;
}

const CreateDraftDialog = ({
  open,
  onClose,
  onSubmit,
  cqlLibrary,
}: CreateDraftDialogProps) => {
  let modelOptions = Object.keys(Model);

  const formik = useFormik({
    initialValues: {
      cqlLibraryName: cqlLibrary?.cqlLibraryName,
      model: cqlLibrary?.model,
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
    onSubmit: async ({ cqlLibraryName, model }) =>
      onSubmit({ ...cqlLibrary, cqlLibraryName }, model),
  });

  const row = {
    display: "flex",
    flexDirection: "row",
  };
  const spaced = {
    marginTop: "23px",
  };
  const formRow = Object.assign({}, row, spaced);
  const gap = {
    columnGap: "24px",
    "& > * ": {
      flex: 1,
    },
  };
  const formRowGapped = Object.assign({}, formRow, gap);

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
            maxLength={64}
          />
        </Box>
        <>
          {!cqlLibrary?.model.includes("QDM") ? (
            <Box sx={formRowGapped}>
              <Select
                placeHolder={{ name: "Model", value: "" }}
                required
                readOnly={cqlLibrary?.model === Model.QICORE_6_0_0}
                disabled={cqlLibrary?.model === Model.QICORE_6_0_0}
                label="Update Model Version"
                id="model-select"
                inputProps={{
                  "data-testid": "cql-library-model-input",
                  id: "model-select",
                  "aria-describedby": "model-select-helper-text",
                  required: true,
                }}
                SelectDisplayProps={{
                  "aria-required": "true",
                }}
                data-testid="cql-library-model-select"
                {...formik.getFieldProps("model")}
                error={formik.touched.model && Boolean(formik.errors.model)}
                helperText={formik.touched.model && formik.errors.model}
                size="small"
                options={modelOptions.map((modelKey) => {
                  if (!modelKey.startsWith("QDM")) {
                    return (
                      <MenuItem
                        key={modelKey}
                        value={Model[modelKey]}
                        data-testid={`cql-library-model-option-${Model[modelKey]}`}
                      >
                        {Model[modelKey]}
                      </MenuItem>
                    );
                  }
                })}
              />
            </Box>
          ) : null}
        </>
      </DialogContent>
    </MadieDialog>
  );
};

export default CreateDraftDialog;
