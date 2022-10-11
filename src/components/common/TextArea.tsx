import React from "react";
import { InputLabel } from "@madie/madie-design-system/dist/react";
import { FormControl, TextField as MUITextField } from "@mui/material";

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
      <InputLabel
        disabled={disabled}
        shrink
        required={required}
        error={error}
        htmlFor={id}
      >
        {label}
      </InputLabel>
      <MUITextField
        multiline
        sx={{
          "& fieldset": {
            border: "none",
          },
          borderRadius: "3px",
          height: "auto", //there's a .13 coming from somewhere.
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
            fontFamily: "Rubik",
            fontSize: 14,
            borderRadius: "3px",
            padding: "9px 14px",
            "&::placeholder": {
              opacity: 0.6,
            },
          },
        }}
        label={null}
        error={error}
        disabled={disabled}
        id={id}
        required={required}
        InputProps={{
          readOnly: readOnly,
        }}
        {...rest}
      />
      {helperText && helperText}
    </FormControl>
  );
};

export default TextArea;
