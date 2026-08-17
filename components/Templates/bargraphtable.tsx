"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog2";
import Highcharts from "highcharts";

import DataTable from "@/components/Templates/ServiceTable";
import HighchartsReact from "highcharts-react-official";

const GraphTableBar = ({
  columns,
  data,
  isDialogOpen,
  setIsDialogOpen,
  title,
  func,
  seriesname,
  yaxistitle
}) => {
  const [tabledata, setTabledata] = useState([]);
  const handlePointClick = async (event) => {
    const point = event.point.name;
    console.log(point,'point')
    const apiData = await func(point);
    setIsDialogOpen(true);
    setTabledata(apiData?.a);
  };

  const options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
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
      type: "category",
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
      title: {
        text: yaxistitle,
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
    legend: {
      enabled: false,
    },
    plotOptions: {
      column: { // Use "column" here instead of "series"
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          format: "{point.y:.1f}",
        },
        events: {
          click: handlePointClick, // Handle click events here
        },
      },
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
      pointFormat:
        '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b> of total<br/>',
    },
    series: [
      {
        name: seriesname,
        colorByPoint: true,
        data: data,
      },
    ],
    drilldown: {
      breadcrumbs: {
        position: {
          align: "right",
        },
      },
    },
  };
  
  const onRowDoubleClick = () => {};
  return (
    <div className="mt-0">
      <div className="w-full h-96 ">
        <div className=" border-gray-400  w-full h-full  pb-0 bg-white dark:bg-primary dark:bg-opacity-10">
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

export default GraphTableBar;
