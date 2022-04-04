import React, { SetStateAction, Dispatch, useState } from "react";
import "styled-components/macro";
import { MadieEditor } from "@madie/madie-editor";

const CqlLibraryEditor = () => {
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useState("");

  const handleMadieEditorValue = (val: string) => {
    setEditorVal(val);
  };

  return (
    <>
      <MadieEditor
        onChange={(val: string) => handleMadieEditorValue(val)}
        value={editorVal}
        height="814px"
      />
    </>
  );
};

export default CqlLibraryEditor;
