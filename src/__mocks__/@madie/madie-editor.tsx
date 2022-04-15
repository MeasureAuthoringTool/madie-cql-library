import React, { ChangeEvent } from "react";

export function MadieEditor({
  onChange,
  value,
  inboundAnnotations,
  readOnly = false,
}) {
  return (
    <>
      <input
        data-testid="cql-library-editor"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
        readOnly={readOnly}
      />
      {inboundAnnotations && inboundAnnotations.length > 0 ? (
        <span>{inboundAnnotations.length} issues found with CQL</span>
      ) : (
        <span>CQL is valid</span>
      )}
    </>
  );
}
