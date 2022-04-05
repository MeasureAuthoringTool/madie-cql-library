import React from "react";
import "styled-components/macro";
import { MadieEditor } from "@madie/madie-editor";

export interface CqlLibraryEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const CqlLibraryEditor = ({ value, onChange }: CqlLibraryEditorProps) => {
  const handleMadieEditorValue = (val: string) => {
    onChange(val);
    // TODO: validate CQL to ELM
  };

  return (
    <>
      <MadieEditor
        onChange={(val: string) => handleMadieEditorValue(val)}
        value={value}
        height="814px"
      />
    </>
  );
};

export default CqlLibraryEditor;
