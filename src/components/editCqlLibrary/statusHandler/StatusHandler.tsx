import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";
import "./StatusHandler.scss";
import * as _ from "lodash";

const generateMadieAlertWithContent = (
  type,
  header,
  secondaryMessages,
  outboundAnnotations
) => {
  const errorAnnotation = _.filter(outboundAnnotations, { type: "error" });
  const errors = errorAnnotation?.map((el) => (
    <li>{transformAnnotation(el)}</li>
  ));
  const warningAnnotation = _.filter(outboundAnnotations, {
    type: "warning",
  });
  const warnings = warningAnnotation?.map((el) => {
    return <li>{transformAnnotation(el)}</li>;
  });
  return (
    <MadieAlert
      type={type}
      content={
        <div aria-live="polite" role="alert">
          <h3
            aria-live="polite"
            role="alert"
            data-testid={`generic-${type}-text-header`}
          >
            {header}
          </h3>
          {secondaryMessages?.length > 0 && (
            <p className="secondary" data-testid="library-warning">
              <ul style={{ listStyle: "inside" }}>
                {secondaryMessages.map((message) => (
                  <li>{message}</li>
                ))}
              </ul>
            </p>
          )}
          {errors?.length > 0 && (
            <>
              <h6>
                ({errors.length}) Error{errors.length > 1 ? "s" : ""}:
              </h6>
              <ul data-testid={`generic-errors-text-list`}>{errors}</ul>
            </>
          )}
          {warnings?.length > 0 && (
            <>
              <h6>
                ({warnings.length}) Warning{warnings.length > 1 ? "s" : ""}:
              </h6>
              <ul data-testid={`generic-warnings-text-list`}>{warnings}</ul>
            </>
          )}
        </div>
      }
      canClose={false}
    />
  );
};

export const transformAnnotation = (annotation) => {
  return `Row: ${annotation.row + 1}, Col:${annotation.column}: ${
    annotation.text
  }`;
};

const StatusHandler = ({
  success,
  error,
  errorMessage,
  outboundAnnotations,
}) => {
  if (success.status === "success") {
    if (outboundAnnotations?.length > 0) {
      return generateMadieAlertWithContent(
        success.status,
        success.primaryMessage,
        success.secondaryMessages,
        outboundAnnotations
      );
    } else {
      return generateMadieAlertWithContent(
        success.status,
        success.primaryMessage,
        success.secondaryMessages,
        null
      );
    }
  }

  if (error) {
    if (errorMessage) {
      if (outboundAnnotations?.length > 0) {
        return generateMadieAlertWithContent(
          "error",
          errorMessage,
          null,
          outboundAnnotations
        );
      } else {
        return generateMadieAlertWithContent("error", errorMessage, null, null);
      }
    } else if (outboundAnnotations?.length > 0) {
      // if we have outboundAnnotations but no error message tied to it
      return generateMadieAlertWithContent(
        "error",
        "Following issues were found within the CQL",
        null,
        outboundAnnotations
      );
    } else {
      // if error flag is true but no information is supplied and no annotations provided
      return generateMadieAlertWithContent(
        "error",
        "Issues were found within the CQL",
        null,
        null
      );
    }
  } else {
    // if the error flag is not true, but we still have errors within the cql
    if (outboundAnnotations?.length > 0) {
      return generateMadieAlertWithContent(
        "error",
        "Following issues were found within the CQL",
        null,
        outboundAnnotations
      );
    }
    return <></>;
  }
};

export default StatusHandler;
