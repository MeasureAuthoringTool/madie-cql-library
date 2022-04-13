import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";
import { useFormik } from "formik";
import * as Yup from "yup";

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

interface VersionType {
  type: string;
}

const CreatVersionDialog = ({ open, onClose, onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      type: "",
    } as VersionType,
    validationSchema: Yup.object().shape({
      type: Yup.string().required("A version type is required."),
    }),
    enableReinitialize: true,
    onSubmit: ({ type }) => onSubmit(type === "major"),
  });

  const classes = useStyles();
  const flexEnd = classNames(classes.row, classes.end);
  const handleDialogClose = () => {
    formik.resetForm({ values: { type: "" } });
    onClose();
  };

  return (
    <Dialog
      open={open}
      data-testid="create-version-dialog"
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      classes={{
        paper: classes.paper,
      }}
    >
      <form
        data-testid="cql-library-version-form"
        onSubmit={formik.handleSubmit}
        style={{ overflow: "scroll" }}
      >
        <div className={classes.dialogTitle}>
          <DialogTitle className={classes.title}>Create Version</DialogTitle>
          <div>
            <IconButton onClick={handleDialogClose}>
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
          <div>
            <FormLabel id="radio-button-dialog">Select a version: </FormLabel>
            <RadioGroup
              aria-labelledby="radio-button-group"
              data-testid="radio-button-group"
              onChange={formik.handleChange}
            >
              <FormControlLabel
                value="major"
                control={<Radio name="type" />}
                label="Major"
              />
              <FormControlLabel
                value="minor"
                control={<Radio name="type" />}
                label="Minor"
              />
            </RadioGroup>
          </div>
        </DialogContent>
        <Divider className={classes.dividerBottom} />
        <DialogActions classes={{ root: classes.actionsRoot }}>
          <Button
            onClick={handleDialogClose}
            data-testid="create-version-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            data-testid="create-version-continue-button"
            disabled={!(formik.isValid && formik.dirty)}
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

export default CreatVersionDialog;