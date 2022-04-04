import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CqlLibrary from "../../models/CqlLibrary";
import CqlLibraryList from "./CqlLibraryList";
import { Model } from "../../models/Model";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = (path: string) => mockPush(path);
    return { push };
  },
}));

const cqlLibrary: CqlLibrary[] = [
  {
    id: "622e1f46d1fd3729d861e6cb",
    cqlLibraryName: "testing1",
    model: Model.QICORE,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
  },
];

describe("CqlLibrary List component", () => {
  it("should display a list of Cql Libraries", () => {
    const { getByText, getByTestId } = render(
      <CqlLibraryList cqlLibraryList={cqlLibrary} />
    );
    cqlLibrary.forEach((c) => {
      expect(getByText(c.cqlLibraryName)).toBeInTheDocument();
      expect(
        screen.getByTestId(`cqlLibrary-button-${c.id}`)
      ).toBeInTheDocument();
    });

    const cqlLibraryModelButton = getByTestId(
      `cqlLibrary-button-${cqlLibrary[0].id}-model`
    );
    expect(cqlLibraryModelButton).toBeInTheDocument();
    userEvent.click(cqlLibraryModelButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      1,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit"
    );

    const cqlLibraryButton = getByTestId(
      `cqlLibrary-button-${cqlLibrary[0].id}`
    );
    fireEvent.click(cqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      2,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit"
    );

    const editCqlLibraryButton = getByTestId(
      `edit-cqlLibrary-${cqlLibrary[0].id}`
    );
    fireEvent.click(editCqlLibraryButton);
    expect(mockPush).toHaveBeenNthCalledWith(
      3,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit"
    );
  });
});
