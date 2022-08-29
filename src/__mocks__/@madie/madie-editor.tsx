import React, { ChangeEvent } from "react";

export const parseContent = jest.fn().mockImplementation((content) => []);
export const validateContent = jest
  .fn()
  .mockImplementation((content) => ({ errors: [], translation: {} }));
export const synchingEditorCqlContent = jest.fn();

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
