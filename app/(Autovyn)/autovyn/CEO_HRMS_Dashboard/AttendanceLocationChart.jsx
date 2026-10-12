"use client";

import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import Exporting from "highcharts/modules/exporting";
import ExportData from "highcharts/modules/export-data";
import Fullscreen from "highcharts/modules/full-screen";

if (typeof Highcharts === "object") {
  Exporting(Highcharts);
  ExportData(Highcharts);
  Fullscreen(Highcharts);
}

const AttendanceLocationChart = ({
  data = [],
  title = "Location Wise Attendance",
}) => {
  const categories = data.map(
    (item) => item.location || "Unknown"
  );

  const options = {
    chart: {
      type: "column",
      height: 450,
    },

    title: {
      text: title,
    },

    xAxis: {
      categories,
      title: {
        text: "Location",
      },
    },

    yAxis: {
      min: 0,
      title: {
        text: "Employee Count",
      },
      allowDecimals: false,
    },

    tooltip: {
      shared: true,
    },

    plotOptions: {
      column: {
        grouping: true,
        borderWidth: 0,
      },
    },

    series: [
      {
        name: "On Time",
        data: data.map(
          (item) => Number(item.ontime || 0)
        ),
      },
      {
        name: "Early Coming",
        data: data.map(
          (item) => Number(item.early || 0)
        ),
      },
      {
        name: "Late Coming",
        data: data.map(
          (item) => Number(item.late || 0)
        ),
      },
      {
        name: "Absent",
        data: data.map(
          (item) => Number(item.absent || 0)
        ),
      },
      {
        name: "On Leave",
        data: data.map(
          (item) => Number(item.onLeave || 0)
        ),
      },
      {
        name: "Weekly Off",
        data: data.map(
          (item) => Number(item.weeklyOff || 0)
        ),
      },
    ],

    credits: {
      enabled: false,
    },

    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          menuItems: [
            "viewFullscreen",
            "downloadPNG",
            "downloadJPEG",
            "downloadPDF",
            "downloadSVG",
            "downloadXLS",
            "downloadCSV",
          ],
        },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-3">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />
    </div>
  );
};

export default AttendanceLocationChart;