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
import { useFeatureFlags } from "@madie/madie-util";

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
  const featureFlags = useFeatureFlags();

  const getModelOptions = (model) => {
    if (model === Model.FHIR_4_0_1) {
      const opts = ["FHIR_4_0_1", "US_CORE_6_1_0", "QICORE_6_0_0"];
      if (featureFlags.qiCore7) opts.push("QICORE_7_0_2");
      opts.push("US_QUALITY_0_5_0");
      return opts;
    }
    if (model === Model.US_CORE_6_1_0) {
      return [
        "US_CORE_6_1_0",
        "QICORE_6_0_0",
        "QICORE_7_0_2",
        "US_QUALITY_0_5_0",
      ];
    }
    if (model === Model.QICORE) {
      if (featureFlags.usQualityCore) {
        const opts = ["QICORE_6_0_0"];
        if (featureFlags.qiCore7) opts.push("QICORE_7_0_2");
        opts.push("US_QUALITY_0_5_0");
        return opts;
      }
      const opts = ["QICORE", "QICORE_6_0_0"];
      if (featureFlags.qiCore7) opts.push("QICORE_7_0_2");
      return opts;
    }
    if (model === Model.QICORE_6_0_0) {
      const opts = ["QICORE_6_0_0"];
      if (featureFlags.qiCore7) opts.push("QICORE_7_0_2");
      if (featureFlags.usQualityCore) opts.push("US_QUALITY_0_5_0");
      return opts;
    }
    if (model === Model.QICORE_7_0_2) {
      const opts = ["QICORE_7_0_2"];
      if (featureFlags.usQualityCore) opts.push("US_QUALITY_0_5_0");
      return opts;
    }
    if (model === Model.US_QUALITY_0_5_0) {
      return ["US_QUALITY_0_5_0"];
    }
    return [];
  };

  // QI-Core v4.1.1 libraries default the dropdown to QI-Core v6.0.0
  // when usQualityCore is on, since 4.1.1 itself isn't offered then.
  const defaultModel =
    cqlLibrary?.model === Model.QICORE && featureFlags.usQualityCore
      ? Model.QICORE_6_0_0
      : cqlLibrary?.model;

  const formik = useFormik({
    initialValues: {
      cqlLibraryName: cqlLibrary?.cqlLibraryName,
      model: defaultModel,
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
          {!cqlLibrary?.model?.includes("QDM") ? (
            <Box sx={formRowGapped}>
              <Select
                placeHolder={{ name: "Model", value: "" }}
                required
                readOnly={getModelOptions(cqlLibrary?.model)?.length === 1}
                disabled={getModelOptions(cqlLibrary?.model)?.length === 1}
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
                options={getModelOptions(cqlLibrary?.model)?.map((modelKey) => {
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
