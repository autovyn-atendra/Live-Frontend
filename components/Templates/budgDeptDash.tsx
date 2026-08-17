"use client";
import React from "react";
import PlainGraph from "@/components/Templates/plainBarGraph";

const BudgDashDept = ({empexp, EmpDept, deptSal, deptSalExc}) => {
  return (
    <div className="  ">
      <div className="grid grid-cols-12 gap-1 mt-1">

        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded p-4 border border-header">
          <PlainGraph
            data={empexp}
            title={"Open Positions By Department"}
            yaxis={"Openings"}
          />
        </div>
        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded p-4 border border-header">
          <PlainGraph
            data={EmpDept}
            title={"Excess Employees By Department"}
            yaxis={"Employees"}
          />
        </div>
        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded p-4 border border-header">
          <PlainGraph
            data={deptSal}
            title={"Salary Budget Remaining By Department"}
            yaxis={"Gross Salary"}
          />
        </div>
        <div className="lg:col-span-12 md:col-span-12 col-span-12 rounded p-4 border border-header">
          <PlainGraph
            data={deptSalExc}
            title={"Excess Salary By Department"}
            yaxis={"Gross Salary"}
          />
        </div>
      </div>
    </div>
  );
};

export default BudgDashDept;

