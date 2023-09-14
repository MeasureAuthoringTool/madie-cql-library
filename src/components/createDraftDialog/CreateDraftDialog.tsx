import React from "react";
import tw from "twin.macro";
import "styled-components/macro";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CqlLibrary } from "@madie/madie-models";
import { HelperText, Label, TextInput } from "@madie/madie-components";
import { synchingEditorCqlContent } from "@madie/madie-editor";
import { Button } from "@madie/madie-design-system/dist/react";

const useStyles = makeStyles({
  row: {
    display: "flex",
    flexDirection: "row",
  },
  end: {
    justifyContent: "flex-end",
    marginBottom: -23,
  },
  paper: {
    position: "relative",
    overflow: "visible",
    marginTop: -20,
  },
  dialogTitle: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
  },
  title: {
    fontFamily: "Rubik",
    fontSize: 24,
    padding: 0,
  },
  close: {
    color: "#242424",
  },
  info: {
    fontSize: 14,
    fontWeight: 300,
    fontFamily: "Rubik",
  },
  asterisk: {
    color: "#D92F2F",
    marginRight: 3,
  },
  dividerBottom: {
    marginTop: 10,
  },
  actionsRoot: {
    padding: 16,
    "& >:not(:first-of-type)": {
      marginLeft: 16,
    },
  },
  chevron: {
    fontSize: 22,
    margin: "-9px -14px -7px 4px",
  },
});

const FormRow = tw.div`mt-3`;

const CreatDraftDialog = ({ open, onClose, onSubmit, cqlLibrary }) => {
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

  const submitForm = async (cqlLibraryName) => {
    const using = cqlLibrary?.model.split(" v");
    const inSyncCql = await synchingEditorCqlContent(
      "",
      cqlLibrary?.cql,
      cqlLibraryName,
      cqlLibrary?.cqlLibraryName,
      cqlLibrary?.version,
      using[0],
      using[1],
      "draftDialog"
    );
    return onSubmit({ ...cqlLibrary, cqlLibraryName, cql: inSyncCql });
  };

  const classes = useStyles();
  const flexEnd = classNames(classes.row, classes.end);

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <HelperText
          data-testid={`${name}-helper-text`}
          text={formik.errors[name]?.toString()}
          isError={isError}
        />
      );
    }
  }

  return (
    <Dialog
      open={open}
      data-testid="create-draft-dialog"
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      classes={{
        paper: classes.paper,
      }}
    >
      <form
        data-testid="cql-library-draft-form"
        onSubmit={formik.handleSubmit}
        style={{ overflow: "scroll" }}
      >
        <div className={classes.dialogTitle}>
          <DialogTitle className={classes.title}>Create Draft</DialogTitle>
          <div>
            <IconButton onClick={onClose}>
              <CloseIcon className={classes.close} />
            </IconButton>
          </div>
        </div>
        <Divider />
        <DialogContent>
          <div className={flexEnd}>
            <Typography className={classes.info}>
              <span className={classes.asterisk}>*</span>
              Required field
            </Typography>
          </div>
          <FormRow>
            <TextInput
              type="text"
              id="cqlLibraryName"
              {...formik.getFieldProps("cqlLibraryName")}
              data-testid="cql-library-name-text-field"
              required={true}
              aria-required={true}
            >
              <Label htmlFor="cqlLibraryName" text="Cql Library Name" />
              {formikErrorHandler("cqlLibraryName", true)}
            </TextInput>
          </FormRow>
        </DialogContent>
        <Divider className={classes.dividerBottom} />
        <DialogActions classes={{ root: classes.actionsRoot }}>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="create-draft-cancel-button"
          >
            Cancel
          </Button>
          <Button
            variant="cyan"
            type="submit"
            data-testid="create-draft-continue-button"
            disabled={!formik.isValid}
            style={{ marginTop: 0 }}
          >
            <span>
              Continue
              <ChevronRightIcon className={classes.chevron} />
            </span>
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatDraftDialog;
