import * as React from "react";
import { render } from "@testing-library/react";
import Home from "./Home";

describe("Home component", () => {
  it("should be in the component", () => {
    const { getByText } = render(<Home />);
    // expect(getByText(/In Progress/i)).toBeInTheDocument();
  });
});
