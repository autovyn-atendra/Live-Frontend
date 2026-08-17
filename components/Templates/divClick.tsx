"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog2";

import DataTable from "@/components/Templates/ServiceTable";
import MediumTitle from "../atoms/MediumTitle";

const DivClickData = ({
  title,
  value,
  tableData,
  columns,
  isDialogOpen,
  setIsDialogOpen,
}) => {
  const [tabledata, setTabledata] = useState([]);
  const handlePointClick = async (event) => {
    setIsDialogOpen(true);
    setTabledata(tableData);
  };

  const onRowDoubleClick = () => {};
  return (
    <div>
      <div onClick={handlePointClick} className=" lg:col-span-3 md:col-span-12 col-span-12  flex  bg-white dark:bg-dark rounded ">
        <div
          className=" lg:text-xl md:text-lg text-base font-bold flex"
        >
          <MediumTitle text={title} />
      <MediumTitle text={value} />
        </div>
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
  );
};

export default DivClickData;
