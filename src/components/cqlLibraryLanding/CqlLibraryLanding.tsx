import React, { useCallback, useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Divider, Tab, Tabs } from "@mui/material";
import useCqlLibraryServiceApi from "../../api/useCqlLibraryServiceApi";
import CqlLibraryList from "../cqlLibraryList/CqlLibraryList";
import * as _ from "lodash";
import { CqlLibrary } from "@madie/madie-models";

function CqlLibraryLanding() {
  const [activeTab, setActiveTab] = useState(0);
  const [cqlLibraryList, setCqlLibraryList] = useState(null);
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;

  // Libraries are fetched again, when a new draft or version is created
  const loadCqlLibraries = useCallback(async () => {
    const cqlLibraries: CqlLibrary[] =
      await cqlLibraryServiceApi.fetchCqlLibraries(activeTab === 0);
    return setCqlLibraryList(() =>
      _.orderBy(cqlLibraries, ["createdAt"], ["desc"])
    );
  }, [activeTab, cqlLibraryServiceApi]);

  useEffect(() => {
    (async () => await loadCqlLibraries())();
  }, [activeTab, cqlLibraryServiceApi, loadCqlLibraries]);

  const handleTabChange = (event, nextTab) => {
    setActiveTab(nextTab);
  };

  return (
    <div id="cql-library-landing" data-testid="cql-library-landing">
      <div className="measure-table">
        <section tw="flex flex-row">
          <div>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                fontWeight: 700,
                color: "#003366",
                "& .MuiTabs-indicator": {
                  height: "4px",
                  backgroundColor: "#0073C8",
                },
                "& .Mui-selected": {
                  fontWeight: 500,
                  color: "#003366 !important",
                },
              }}
            >
              <Tab
                sx={{
                  padding: "24px 21px",
                  fontFamily: "Rubik, sans serif",
                  borderRadius: "6px 0 0 0",
                  fontWeight: 400,
                  color: "#003366",
                }}
                label={`My CQL Libraries`}
                data-testid="my-cql-libraries-tab"
              />
              <Tab
                sx={{
                  padding: "24px 21px",
                  fontFamily: "Rubik, sans serif",
                  borderRadius: "0 6px 0 0",
                  fontWeight: 400,
                  color: "#003366",
                }}
                label="All CQL Libraries"
                data-testid="all-cql-libraries-tab"
              />
            </Tabs>
            <Divider />
          </div>
          <span tw="flex-grow" />
        </section>
        <div>
          <div className="table">
            <CqlLibraryList
              cqlLibraryList={cqlLibraryList}
              onListUpdate={loadCqlLibraries}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CqlLibraryLanding;
