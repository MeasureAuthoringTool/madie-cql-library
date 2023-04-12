import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
export interface NavTabProps {
  activeTab: any;
  handleTabChange: any;
}

export default function CreateTestCaseNavTabs(props: NavTabProps) {
  const { activeTab, handleTabChange } = props;
  return (
    <Tabs value={activeTab} onChange={handleTabChange} type="B">
      <Tab
        type="B"
        label={`CQL Library Details`}
        data-testid="CQL Library Details"
        value="details"
      />
    </Tabs>
  );
}
