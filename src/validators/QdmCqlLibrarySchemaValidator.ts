import * as Yup from "yup";
import { Model } from "@madie/madie-models";

export const QdmCqlLibrarySchemaValidator = Yup.object().shape({
  cqlLibraryName: Yup.string()
    .max(64, "Library name cannot be more than 64 characters.")
    .required("Library name is required.")
    .matches(
      /^[A-Z][a-zA-Z0-9_]*$/,
      "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters except of underscore for QDM."
    ),
  description: Yup.string().required("Description is required."),
  publisher: Yup.string().required("Publisher is required."),
  model: Yup.string()
    .oneOf(Object.values(Model))
    .required("A CQL library model is required."),
  cql: Yup.string().nullable(),
});
