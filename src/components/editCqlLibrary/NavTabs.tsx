import React from "react";
import { Tabs, Tab } from "@mui/material";
export interface NavTabProps {
  activeTab: any;
  handleTabChange: any;
}

const defaultStyle = {
  padding: "0px 10px",
  height: "45px",
  minHeight: "45px",
  textTransform: "none",
};

export default function CreateTestCaseNavTabs(props: NavTabProps) {
  const { activeTab, handleTabChange } = props;
  return (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      sx={{
        fontWeight: 400,
        height: "45px",
        minHeight: "45px",
        padding: 0,
        paddingLeft: "32px",
        fontSize: "14px",
        fontFamily: "Rubik, sans serif",
        color: "#333333",
        borderBottom: "solid 1px #DDDDDD",
        "& .MuiTabs-indicator": {
          height: "4px",
          backgroundColor: "#209FA6",
        },
        "& .Mui-selected": {
          fontWeight: 600,
          color: "#515151 !important",
        },
      }}
    >
      <Tab
        sx={defaultStyle}
        label={`CQL Library Details`}
        data-testid="CQL Library Details"
        value="details"
      />
    </Tabs>
  );
}
