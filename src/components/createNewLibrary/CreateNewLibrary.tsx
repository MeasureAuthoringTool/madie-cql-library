import React, { useEffect, useState } from "react";
import CreateNewLibraryDialog from "../common/CreateNewLibraryDialog";

const CreateNewLibrary = () => {
  const [createLibOpen, setCreateLibOpen] = useState<boolean>(false);

  useEffect(() => {
    const openCreateLibraryDialogListener = () => {
      setCreateLibOpen(true);
    };
    window.addEventListener(
      "openCreateLibraryDialog",
      openCreateLibraryDialogListener,
      false
    );
    return () => {
      window.removeEventListener(
        "openCreateLibraryDialog",
        openCreateLibraryDialogListener,
        false
      );
    };
  }, []);

  return (
    <CreateNewLibraryDialog
      open={createLibOpen}
      onClose={() => {
        setCreateLibOpen(false);
      }}
    />
  );
};

export default CreateNewLibrary;
