"use client";
import React from "react";
import OrgChart from "react-orgchart";

const OrgChartComponent = ({ data }) => {
  const getNode = (node) => {
    return {
      id: node.name,
      name: node.name,
      title: node.title,
      img: node.img,
      children: node.directReports.map(getNode),
    };
  };

  const orgChartData = getNode(data);

  return (
    <div>
      <OrgChart
        datasource={orgChartData}
        pan={true}
        zoom={true}
        nodeTemplate={(data) => (
          <div>
            <img
              src={data.img}
              alt={data.name}
              style={{ width: "100px", height: "100px" }}
            />
            <h2>{data.name}</h2>
            <p>{data.title}</p>
          </div>
        )}
      />
    </div>
  );
};

export default OrgChartComponent;
