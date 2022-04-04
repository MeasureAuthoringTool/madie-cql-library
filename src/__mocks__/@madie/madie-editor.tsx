import React, { ChangeEvent } from "react";

export function MadieEditor({ onChange, value, inboundAnnotations }) {
  return (
    <>
      <input
        data-testid="cql-library-editor"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
      />
      {inboundAnnotations && inboundAnnotations.length > 0 ? (
        <span>{inboundAnnotations.length} issues found with CQL</span>
      ) : (
        <span>CQL is valid</span>
      )}
    </>
  );
}