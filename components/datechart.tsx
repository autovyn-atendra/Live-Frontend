"use client";
import React, { useEffect, useRef } from "react";
import Highcharts from "highcharts";
import exporting from "highcharts/modules/exporting";
import offlineExporting from "highcharts/modules/offline-exporting"
import fullScreen from "highcharts/modules/full-screen";
import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

if (typeof Highcharts === 'object') {
  exporting(Highcharts);
  offlineExporting(Highcharts);
  fullScreen(Highcharts);
}

const getRandomColor = () => {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`;
};

const ChartCard = ({ title, data, height, type = "column" ,DATE_FROM,DATE_TO,heading}) => {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (chartContainerRef.current && data.length) {
      const sum = data.reduce((acc, item) => acc + item.chart_data, 0);
      const chartOptions = {
        chart: {
          type: type,
          backgroundColor: "transparent",
          options3d: {
            enabled: true,
            alpha: 15,
          },
        },
        title: {
          text: `${title} - (${sum.toFixed(2)})`,
          style: {
            fontSize: "14px",
            fontWeight: "bold",
            color: "#999999",
          },
        },
        xAxis: {
          categories: data.map(item => item.loc_code),
          labels: {
            style: {
              fontSize: "14px",
              color: "#999999",
            },
          },
        },
        yAxis: {
          min: 0,
          title: {
            text: null,
          },
          labels: {
            style: {
              fontSize: "14px",
              color: "#999999",
            },
          },
        },
        tooltip: {
          shared: true,
          useHTML: true,
          backgroundColor: "#333",
          style: { color: "#FFFFFF" },
        },
        plotOptions: {
          series: {
            animation: {
              duration: 2000,
              easing: "easeOutBounce",
            },
          },
          column: {
            depth: 40,
            pointPadding: 0.2,
            borderWidth: 0,
          },
        },
        series: [
          {
            name: title,
            data: data.map(item => ({
              y: item.chart_data,
              color: getRandomColor(),
            })),
          },
        ],
      };
      Highcharts.chart(chartContainerRef.current, chartOptions);
    }
  }, [data, type]);

  const exportToExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);
    worksheet.addRow([`${heading} ---> ${title} ---> Date From ${DATE_FROM} To ${DATE_TO}`]);
    worksheet.mergeCells("A1:K1");
    worksheet.addRow(["Location Code", "Chart Data"]);
    data.forEach(item => worksheet.addRow([item.loc_code, item.chart_data]));
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `${title}.xlsx`);
    });
  };

  return (
    <div className={`h-full`} >
      <div ref={chartContainerRef} className={`w-full bg-white dark:bg-primary dark:bg-opacity-10 ${height || "h-52"}`} />
      <div className="mt-2">
        <Button onClick={exportToExcel} size="sm" className="bg-primary text-white p-2 rounded ml-2">
          Export to Excel
        </Button>
      </div>
    </div>
  );
};

export default ChartCard;
