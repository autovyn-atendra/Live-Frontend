 
"use client";
import React, { useEffect, useState } from "react";
import { Drawer, Box, Typography, IconButton, Divider } from "@mui/material";
import { IoMdClose } from "react-icons/io";

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    columns: { labelKey: string; priceKey: string }[];
    data: Record<string, any>[];
    position?: "left" | "right" | "top" | "bottom";
    width?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
    open,
    onClose,
    title = "Cost Breakdown",
    columns,
    data,
    position = "right",
    width = 350,
}) => {
   
    const renderCostDetails = () => {
        if (!data || data.length === 0) return null;
        const item = data[0];

        return columns.map((col, index) => {
            const label = item[col.labelKey];
            const price = item[col.priceKey];

            // Apply colors if provided, otherwise default
            const labelColor = col.labelColor || '#333';
            const priceColor = col.priceColor || '#000080';
            const backgroundColor = col.backgroundColor || '#f5f5f5';

            if (label && price !== null && price !== undefined) {
                return (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            backgroundColor: backgroundColor || '#f5f5f5',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '2px solid',            // Add border style
                            borderColor: '#1976d2',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: labelColor, fontSize: 20 }}>
                            {label}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: priceColor }}>
                            {price}
                        </Typography>

                    </Box>
                );
            }

            return null;
        });
    };
 
    const [footerTax, setFooterTax] = useState("");
    const [priceColor, setPriceColor] = useState("inherit");


    useEffect(() => {
        const payableCol = columns.find(col => col.priceKey === "Payable_Amount_value");
        if (!payableCol) return;

        const item = data[0] || [];
        let price1
        columns.map((col, index) => {
            const label = item[col?.labelKey];
            const price = item[col?.priceKey];
            if (label == "Payable Amount") {
                price1 = price
            }
        })
        const numeric = Number(price1);
        if (!isNaN(numeric)) {
            if (numeric < 0) {
                setFooterTax(`RS (${Math.abs(numeric)}) EXCESS`);
                setPriceColor("red");
            } else if (numeric > 0) {
                setFooterTax(`RS (${numeric}) SHORT`);
                setPriceColor("green");
            } else {
                setFooterTax("");
                setPriceColor("inherit");
            }
        }

    }, [columns]);




    return (
        <Drawer
            anchor={position}
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: width,
                    borderRadius: '8px 0 0 8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: '#1976d2',
                    color: '#fff',
                    borderBottom: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px 0 0 0',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                    <IoMdClose size={24} />
                </IconButton>
            </Box>

            {/* Main Content */}
            <Box sx={{ padding: '16px', backgroundColor: '#fff', height: '100%', overflowY: 'auto' }}>
        
                {renderCostDetails()}

         
            </Box>

                   <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '12px 16px',
                        marginBottom: '8px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '2px solid',            // Add border style
                        borderColor: '#1976d2',
                    }}
                >
                    <Typography sx={{ fontWeight: 800, color: priceColor, fontSize: 20 }}>
                        {footerTax}
                    </Typography>
                </Box>
        </Drawer>
    );
};

export default Sidebar;