import React from "react";
import GlobalStyles from "./styles/GlobalStyles";
import "./styles/tailwind.css";

export default function Root(props) {
  return (
    <>
      <GlobalStyles />
      <span className="cl:text-blue-900">{props.name} is mounted!</span>
    </>
  );
}
