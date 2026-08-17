import React, { useEffect, useRef } from "react";
import Highcharts from "highcharts";

const FullScreenChart = ({ data, type, title, color }) => {
  const chartContainerRef = useRef(null);
  function getRandomColor() {
    const vibrantColors = [
      // "#FF6347", // Tomato
      // "#FFA500", // Orange
      "#FFD700", // Gold
      "#32CD32", // Lime Green
      "#00FFFF", // Cyan
      "#1E90FF", // Dodger Blue
    ];
    return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
  }
  useEffect(() => {
    if (chartContainerRef.current) {
      const chartOptions = {
        chart: {
          type: type, // Use the type prop to determine the chart type
          backgroundColor: "transparent",
          options3d: {
            enabled: true,
            alpha: 15,
          },
          height: "60%",
        },

        title: {
          text: title,
          skew3d: true,
          style: {
            fontSize: "14px",
            fontWeight: "normal",
            color: "#999999",
            textTransform: "capitalize",
          },
        },
        xAxis: {
          categories: data.map((item) => item.loc_code),
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
            '<span style="font-size:10px; color:#999999;">{point.key}</span><table>',
          pointFormat:
            '<tr><td style="color:{series.color};padding:0;font-size:14px">{series.name}: </td>' +
            '<td style="padding:0;font-size:14px; color:#999999;">{point.y:.1f}</td></tr>',
          footerFormat: "</table>",
          shared: true,
          useHTML: true,
        },
        plotOptions: {
          series: {
            animation: {
              duration: 2000, // Duration of the animation in milliseconds
              easing: "easeOutBounce", // Easing function for the animation
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
          },
        },
        series: [
          {
            name: title,
            data: data.map((item) => ({
              y: item.chart_data,
              color: getRandomColor(), // Generate a random color for each data point
            })),
            color: "#f3f4f6",
          },
        ],
      };

      Highcharts.chart(chartContainerRef.current, chartOptions);
    }
  }, [data, type]);

  return <div ref={chartContainerRef} className="w-full h-full"></div>;
};

export default FullScreenChart;
