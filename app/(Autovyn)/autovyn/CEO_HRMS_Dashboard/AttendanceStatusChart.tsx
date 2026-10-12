"use client";

import React, { useEffect, useRef } from "react";
import Highcharts from "highcharts";
import exporting from "highcharts/modules/exporting";
import fullScreen from "highcharts/modules/full-screen";

if (typeof Highcharts === "object") {
    exporting(Highcharts);
    fullScreen(Highcharts);
}

const AttendanceStatusChart = ({
    data = {},
    type = "column",
    title = "Today's Attendance Status"
}) => {

    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {

        if (!chartContainerRef.current) {
            return;
        }

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const summary = data || {};

        chartRef.current = Highcharts.chart(
            chartContainerRef.current,
            {

                chart: {
                    type: type || "column",
                    backgroundColor: "transparent",
                    height: 400
                },

                title: {
                    text: title,
                    style: {
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#666"
                    }
                },

                xAxis: {

                    categories: [
                        "Attendance"
                    ],

                    labels: {
                        style: {
                            fontSize: "15px",
                            fontWeight: "600"
                        }
                    }

                },

                yAxis: {

                    min: 0,

                    allowDecimals: false,

                    title: {
                        text: "Employees"
                    }

                },

                tooltip: {

                    shared: true,

                    useHTML: true,

                    headerFormat:
                        "<b>{point.key}</b><table>",

                    pointFormat:
                        `<tr>
                            <td style="color:{series.color};padding-right:15px">
                                {series.name}
                            </td>
                            <td>
                                <b>{point.y}</b>
                            </td>
                        </tr>`,

                    footerFormat: "</table>"

                },

                plotOptions: {

                    column: {

                        borderWidth: 0,

                        borderRadius: 5,

                        pointPadding: 0.05,

                        groupPadding: 0.15

                    },

                    series: {

                        animation: {

                            duration: 1000

                        }

                    }

                },

                legend: {

                    enabled: true

                },

                credits: {

                    enabled: false

                },

                exporting: {

                    enabled: true,

                    buttons: {

                        contextButton: {

                            menuItems: [

                                "viewFullscreen",

                                "separator",

                                "downloadPNG",

                                "downloadJPEG",

                                "downloadPDF",

                                "downloadSVG"

                            ]

                        }

                    }

                },

                series: [

                    {
                        name: "On Time",
                        data: [
                            Number(summary.ontime || 0)
                        ],
                        color: "#22C55E"
                    },

                    {
                        name: "Early Coming",
                        data: [
                            Number(summary.early || 0)
                        ],
                        color: "#3B82F6"
                    },

                    {
                        name: "Late Coming",
                        data: [
                            Number(summary.late || 0)
                        ],
                        color: "#F59E0B"
                    },

                    {
                        name: "Absent",
                        data: [
                            Number(summary.absent || 0)
                        ],
                        color: "#EF4444"
                    },

                    {
                        name: "On Leave",
                        data: [
                            Number(summary.onLeave || 0)
                        ],
                        color: "#8B5CF6"
                    },

                    {
                        name: "Weekly Off",
                        data: [
                            Number(summary.weeklyOff || 0)
                        ],
                        color: "#6B7280"
                    }

                ]

            }
        );

        return () => {

            if (chartRef.current) {

                chartRef.current.destroy();

                chartRef.current = null;

            }

        };

    }, [
        data,
        type,
        title
    ]);


    return (

        <div className="w-full">

            <div
                ref={chartContainerRef}
                className="w-full"
            />

        </div>

    );

};

export default AttendanceStatusChart;