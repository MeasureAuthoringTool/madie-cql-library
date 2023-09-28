import * as React from "react";
import { render, screen } from "@testing-library/react";
import StatusHandler, { transformAnnotation } from "./StatusHandler";

describe("StatusHandler Component", () => {
  const { getByTestId } = screen;
  const annotationsObject = [
    {
      row: 2,
      column: 1,
      type: "error",
      text: "ELM: 1:56 | 401 : [no body]",
    },
    {
      row: 3,
      column: 5,
      type: "warning",
      text: "ELM: 1:56 | 401 : [no body]",
    },
  ];

  it("Should display a success message and a library warning if a library warning exists when no error or messages present, also displays a list of annotations", () => {
    const success = {
      status: "success",
      message:
        "CQL updated successfully! Library Statement or Using Statement were incorrect. MADiE has overwritten them to ensure proper CQL.",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    expect(screen.getByTestId("library-warning")).toHaveTextContent(
      success.message
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a success message and a using warning if a using warning exists when no error or messages present, also displays a list of annotations", () => {
    const success = {
      status: "success",
      message:
        "CQL updated successfully but was missing a Using statement. Please add in a valid model and version.",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    expect(screen.queryByTestId("library-warning")).not.toBeInTheDocument();
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a success message along with annotation", () => {
    const success = {
      status: "success",
      message: "stuff saved successfully",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    expect(screen.queryByTestId("library-warning")).not.toBeInTheDocument();
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a generic success message when no annotations or messages are present", () => {
    const success = {
      status: "success",
      message: "stuff saved successfully",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={[]}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      success.message
    );
    expect(
      screen.queryByTestId("generic-errors-text-list")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-warnings-text-list")
    ).not.toBeInTheDocument();
  });

  //all error conditions

  it("Should display an error message with provided errorMessage and annotations", () => {
    const success = {
      status: undefined,
      message: "",
    };
    const errorMessage = "CQL problem please help";
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={errorMessage}
        outboundAnnotations={annotationsObject}
      />
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      errorMessage
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display an error message with provided error message and no annotations", () => {
    const success = {
      status: undefined,
      message: "",
    };
    const errorMessage = "CQL problem please help";
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={errorMessage}
        outboundAnnotations={[]}
      />
    );

    expect(getByTestId("generic-error-text-header")).toHaveTextContent(
      errorMessage
    );
    expect(screen.queryByTestId("library-warning")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-errors-text-list")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-warnings-text-list")
    ).not.toBeInTheDocument();
  });

  it("Should display a generic error message along with annotations provided", () => {
    const success = {
      status: undefined,
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
      />
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      "Following issues were found within the CQL"
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a generic error message when no error message or annotations are provided, but error flag is true", () => {
    const success = {
      status: undefined,
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={""}
        outboundAnnotations={[]}
      />
    );

    expect(getByTestId("generic-error-text-header")).toHaveTextContent(
      "Issues were found within the CQL"
    );
    expect(screen.queryByTestId("library-warning")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-errors-text-list")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-warnings-text-list")
    ).not.toBeInTheDocument();
  });

  it("Should display outbound annotation even when Error flag is false", () => {
    const success = {
      status: undefined,
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage=""
        outboundAnnotations={annotationsObject}
      />
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      "Following issues were found within the CQL"
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });
});
