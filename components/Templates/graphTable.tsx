"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog2";
import Highcharts from "highcharts";

import DataTable from "@/components/Templates/ServiceTable";
import HighchartsReact from "highcharts-react-official";

const GraphTable = ({
  columns,
  data,
  isDialogOpen,
  setIsDialogOpen,
  title,
  func,
}) => {
  const [tabledata, setTabledata] = useState([]);
  const handlePointClick = async (event) => {
    const point = event.point.name;
    const apiData = await func(point);
    setIsDialogOpen(true);
    setTabledata(apiData?.a);
  };

  const options = {
    chart: {
      type: "pie", 
      backgroundColor: "transparent",
      options3d: {
        enabled: true,
        alpha: 15,
      },
    },
    title: {
      text: title,
      skew3d: true,
      style: {
        fontSize: "20px",
        fontWeight: "bold",
        align:"left",
        color: "#999999",
        textTransform: "capitalize",
      },
    },
    xAxis: {
      categories: data,
      labels: {
        style: {
          fontSize: "14px",
          fontWeight: "normal",
          color: "#999999",
        },
      },
      title: {
        text: null,
        color: "#999999",
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: null,
        align: "high",
        color: "#999999",
      },
      labels: {
        style: {
          fontSize: "14px",
          fontWeight: "normal",
          color: "#999999",
        },
      },
    },
    tooltip: {
      headerFormat:
        '<span style="font-size:14px; color:#999999;">{point.key}</span><table>',
      pointFormat:
        '<tr><td style="color:{series.color};padding:0;font-size:14px">{series.name}: </td>' +
        '<td style="padding:0;font-size:14px; color:#999999;">{point.y}</td></tr>',
      footerFormat: "</table>",
      shared: true,
      useHTML: true,
    },
    plotOptions: {
      series: {
        animation: {
          duration: 2000, 
          easing: "easeOutBounce", 
        },
      },
      column: {
        stacking: "normal",
        depth: 40,
        pointPadding: 0.2,
        borderWidth: 0,
        groupZPadding: "numeric value",
      },
      pie: {
        depth: "numeric value",
        events: {
          click: handlePointClick, 
        },
      },
    },
    series: [
      {
        name: title,
        data: data,
      },
    ],
  };
  const onRowDoubleClick = () => {};
  return (
    <div className="mt-3">
      <div className="w-full h-96 shadow-signUp ">
        <div className=" border-gray-400 rounded-xl w-full h-full  pb-2 bg-white dark:bg-primary dark:bg-opacity-10">
          <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
        <div className="col-span-12 mt-2 items-center w-full">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-[1000px] xs:h-[550px]">
              <DialogTitle>{title}</DialogTitle>
              <hr className="bg-body-color" />
              <DataTable
                columns={columns}
                data={tabledata}
                onRowDoubleClick={onRowDoubleClick}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default GraphTable;
