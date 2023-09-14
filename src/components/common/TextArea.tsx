import React from "react";
import { TextField } from "@madie/madie-design-system/dist/react";
import { FormControl } from "@mui/material";

const TextArea = ({
  id,
  error = false,
  helperText = undefined,
  required = false,
  disabled = false,
  readOnly = false,
  label,
  ...rest
}) => {
  return (
    <FormControl fullWidth error={error}>
      <div
        style={{
          width: 1,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      />
      <TextField
        label={label}
        multiline
        sx={{
          // resize: "vertical",
          borderRadius: "3px",
          height: "auto",
          border: "1px solid #DDDDDD",
          marginTop: "8px",
          // remove weird line break from legend
          "& .MuiOutlinedInput-notchedOutline": {
            borderRadius: "3px",
            "& legend": {
              width: 0,
            },
          },
          "& .MuiOutlinedInput-root": {
            padding: 0,
            "&&": {
              borderRadius: "3px",
            },
          },
          // input base selector
          "& .MuiInputBase-input": {
            color: "#333",
            resize: "vertical",
            minHeight: "95px",
            fontFamily: "Rubik",
            fontSize: 14,
            borderRadius: "3px",
            padding: "9px 14px",
            "&::placeholder": {
              opacity: 1,
              color: "#717171",
            },
          },
        }}
        required={required}
        disabled={disabled}
        id={id}
        inputProps={{
          "data-testid": id,
          "aria-described-by": `${id}-helper-text`,
          "aria-required": required ? true : false,
          required: required,
        }}
        helperText={helperText}
        readOnly={readOnly}
        InputProps={{
          readOnly: readOnly,
        }}
        error={error}
        {...rest}
      />
    </FormControl>
  );
};

export default TextArea;
