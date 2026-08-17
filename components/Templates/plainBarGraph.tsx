"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog2";
import Highcharts from "highcharts";

import DataTable from "@/components/Templates/ServiceTable";
import HighchartsReact from "highcharts-react-official";

const PlainGraph = ({
  data,
  title,
  yaxis
}) => {

  const options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",

    },
    title: {
      align: "left",
      text: title,
      
      
        style: {
          color: "grey" // Text color for y-axis
        }
    },
    xAxis: {
      type: "category",
      labels: {
        style: {
          color: "grey" // Text color for y-axis
        }
      }
    },
    
    yAxis: {
      title: {
        text: yaxis,
      },
      labels: {
        style: {
          color: "grey" // Text color for y-axis
        }
      }
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      column: { 
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          format: "{point.y:.1f}",
        },
       
      },
    },
    tooltip: {
      headerFormat: '<span style="font-size:11px text-base">{series.name}</span><br>',
      pointFormat:
        '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}</b> of total<br/>',
    },
    series: [
      {
        name: "Department",
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
  
  return (
    <div className="">
      <div className="w-full h-96 shadow-signUp ">
        <div className=" border-gray-400 rounded-xl w-full h-full p-4  bg-white dark:bg-primary dark:bg-opacity-10">
          <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
      </div>
    </div>
  );
};

export default PlainGraph;
