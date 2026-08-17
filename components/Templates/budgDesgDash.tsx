"use client";
import React from "react";
import PlainGraph from "@/components/Templates/plainBarGraph";

const BudgDashDesg = ({desgBudg, desgBudg1, desgSal, desgSalExc}) => {
  return (
    <div className="">
      <div className="grid grid-cols-12 gap-1 mt-1">
        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded   p-4 border border-header">
          <PlainGraph
            data={desgBudg}
            title={"Open Positions By Designation"}
            yaxis={"Openings"}
          />
        </div>
        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded  p-4 border border-header">
          <PlainGraph
            data={desgBudg1}
            title={"Excess Employees By Designation"}
            yaxis={"Employees"}
          />
        </div>
        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded  p-4 border border-header">
          <PlainGraph
            data={desgSal}
            title={"Salary Budget By Designation"}
            yaxis={"Gross Salary"}
          />
        </div>
        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded   p-4 border border-header">
          <PlainGraph
            data={desgSalExc}
            title={"Excess Salary By Designation"}
            yaxis={"Gross Salary"}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgDashDesg;

