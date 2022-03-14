import * as Yup from "yup";

export const CqlLibrarySchemaValidator = Yup.object().shape({
  cqlLibraryName: Yup.string()
    .max(255, "Library name cannot be more than 255 characters.")
    .required("Library name is required.")
    .matches(
      /^[A-Z][a-zA-Z0-9]*$/,
      "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
    ),
});
