"use client";
import React, { useEffect, useState } from "react";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import Acheckbox from "@/components/atoms/Checkbox";
import { LiaRupeeSignSolid } from "react-icons/lia";
import AButton from "@/components/atoms/Buttton";
import { BsPersonLinesFill } from "react-icons/bs";
import { MdOutlineFormatListNumbered } from "react-icons/md";
import { FaIdCard } from "react-icons/fa";
const Financeform = ({ back, cust_Id }) => {
  const [formData, setFormData] = useState({
    Customer_ID: "",
    Invoice_No: "",
    Customer_Name: "",
    VIN: "",
    Chassis_No: "",
    Branch: "",
    Financier_HYP: "",
    Fin_Type: "",
    Finance_Received_Date: "",
    ERPTL: "",
    ERPDSE: "",
    MSSF_ID: "",
    ROI: "",
    Tenure_Month: "",
    Finance_Do_No: "",
    Finance_Do_Date: "",
    Loan_Disbursement_Date: "",
    Finance_Do_Amt: "",
    Finance_PF_Charge: "",
    Finance_Payment_Received: "",
    Los_Number: "",
    Short_Payment: "",
    Payout_Percentage: "",
    Gross_Payout: "",
    Subvention_Percentage: "",
    Subvention_Amt: "",
    Taxable_Amt: "",
    Payout_Amt: "",
    GST_Amt: "",
    GST_Percentage: "18",
    Net_Payout: "",
  });
  const [checkbox, setCheckbox] = useState(false);
  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name, value) => {
    setCheckbox(value);
  };

  const calculateShortPayment = () => {
    let financeDoAmt = parseFloat(formData.Finance_Do_Amt);
    let financePaymentReceived = parseFloat(formData.Finance_Payment_Received);
    if (isNaN(financeDoAmt) && !isNaN(financePaymentReceived)) {
      let shortPayment = -financePaymentReceived;
      setFormData((prevData) => ({
        ...prevData,
        Short_Payment: shortPayment.toFixed(2),
      }));
    } else if (!isNaN(financeDoAmt)) {
      if (!isNaN(financePaymentReceived)) {
        let shortPayment = financeDoAmt - financePaymentReceived;
        setFormData((prevData) => ({
          ...prevData,
          Short_Payment: shortPayment.toFixed(2),
        }));
      } else {
        setFormData((prevData) => ({
          ...prevData,
          Short_Payment: financeDoAmt.toFixed(2),
        }));
      }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        Short_Payment: "",
      }));
    }
  };

  const calculateGrosspayoutandtaxableamt = () => {
    let financePaymentReceived = parseFloat(formData.Finance_Payment_Received);
    let subventionPercentage = parseFloat(formData.Subvention_Percentage);
    let PayoutPercentage = parseFloat(formData.Payout_Percentage);
    let subventionAmt = parseFloat(formData.Subvention_Amt);
    if (isNaN(subventionPercentage) && isNaN(subventionAmt)) {
      let grosspayout = (financePaymentReceived * PayoutPercentage) / 100;
      setFormData((prevData) => ({
        ...prevData,
        Gross_Payout: grosspayout.toFixed(2),
        Taxable_Amt: grosspayout.toFixed(2),
      }));
    } else {
      let grosspayout = (financePaymentReceived * PayoutPercentage) / 100;
      let Subvention = (financePaymentReceived * subventionPercentage) / 100;
      let taxableamt = grosspayout - Subvention;
      setFormData((prevData) => ({
        ...prevData,
        Subvention_Amt: Subvention.toFixed(2),
        Taxable_Amt: taxableamt.toFixed(2),
      }));
    }
  };

  const calculateNetPayout = () => {
    if (checkbox) {
      let taxableAmt = parseFloat(formData.Taxable_Amt);
      let payoutamt = (taxableAmt * 100) / 118;
      let gstamt = taxableAmt - payoutamt;
      setFormData((prevData) => ({
        ...prevData,
        Payout_Amt: payoutamt.toFixed(2),
        GST_Amt: gstamt.toFixed(2),
        Net_Payout: taxableAmt.toFixed(2),
      }));
    } else {
      let taxableAmt = parseFloat(formData.Taxable_Amt);
      let gstAmount = (taxableAmt * 18) / 100;
      let netpay = taxableAmt + gstAmount;
      setFormData((prevData) => ({
        ...prevData,
        Payout_Amt: taxableAmt.toFixed(2),
        GST_Amt: gstAmount.toFixed(2),
        Net_Payout: netpay.toFixed(2),
      }));
    }
  };

  useEffect(() => {
    calculateShortPayment();
    calculateGrosspayoutandtaxableamt();
    calculateNetPayout();
  }, [
    formData.Finance_Payment_Received,
    formData.Finance_Do_Amt,
    formData.Payout_Percentage,
    formData.Subvention_Percentage,
    formData.Gross_Payout,
    formData.Subvention_Amt,
    formData.Taxable_Amt,
    formData.Payout_Amt,
    checkbox,
  ]);

  console.log(cust_Id, "CustomerId");

  return (
    <div>
      <div className="grid grid-cols-12 gap-3">
        <div className="lg:col-span-6 col-span-12 shadow dark:bg-primary dark:bg-opacity-10 pb-5 rounded-b">
          <div className="rounded-t col-span-12 bg-white dark:bg-dark mb-2 px-6 py-.5">
            <div className=" items-center justify-between gap-4">
              <h1 className="px-1 py-2 font-semibold text-base lg:text-xl  text-pretty  uppercase">
                Fill By ICM Team
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 pr-2 pl-2  ">
            <div className="relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Customer_ID"
                type="text"
                title="Customer ID"
                value={formData.Customer_ID}
              />
              <FaIdCard className="absolute top-6 right-2 h-5 w-8 " />
            </div>
            <div className="relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Invoice_No"
                type="number"
                title="Invoice No."
                value={formData.Invoice_No}
              />
              <MdOutlineFormatListNumbered className="absolute top-6 right-3 h-5 w-8  " />
            </div>
            <div className="  relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Customer_Name"
                type="text"
                title="Customer Name"
                value={formData.Customer_Name}
              />
              <BsPersonLinesFill className="absolute top-6 right-2 h-5 w-8  " />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="VIN"
                type="text"
                title="VIN"
                value={formData.VIN}
              />
            </div>
            <div className=" relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Chassis_No"
                type="number"
                title="Chassis No."
                value={formData.Chassis_No}
              />
              <MdOutlineFormatListNumbered className="absolute top-6 right-3 h-5 w-8 " />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <SelectSearch title="Branch" />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <SelectSearch title="Financier/HYP" />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <SelectSearch title="Fin Type" />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Finance_Received_Date"
                type="date"
                title="Finance Received Date"
                value={formData.Finance_Received_Date}
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="ERPTL"
                type="text"
                title="ERPTL"
                value={formData.ERPTL}
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="ERPDSE"
                type="text"
                title="ERPDSE"
                value={formData.ERPDSE}
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="MSSF_ID"
                type="text"
                title="MSSF ID"
                value={formData.MSSF_ID}
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="ROI"
                type="text"
                title="ROI"
                value={formData.ROI}
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Tenure_Month"
                type="text"
                title="Tenure Month"
                value={formData.Tenure_Month}
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 col-span-12 shadow dark:bg-primary dark:bg-opacity-10 pb-5 rounded-b">
          <div className="rounded-t col-span-12 bg-white dark:bg-dark mb-2 px-6 py-.5">
            <div className=" items-center justify-between gap-4">
              <h1 className="px-1 py-2 font-semibold text-pretty text-base lg:text-xl uppercase">
                Fill By Finance Team
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 pl-2 pr-2 ">
            <div className=" relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Finance_Do_No"
                type="text"
                title="finance Do No."
                value={formData.Finance_Do_No}
              />
              <MdOutlineFormatListNumbered className="absolute top-6 right-3 h-5 w-8 " />
            </div>
            <div className="lg:col-span-3 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Finance_Do_Date"
                type="date"
                title="finance Do Date"
                value={formData.Finance_Do_Date}
              />
            </div>
            <div className="lg:col-span-3 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Loan_Disbursement_Date"
                type="date"
                title="Loan Dis. Date"
                value={formData.Loan_Disbursement_Date}
              />
            </div>
            <div className=" relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Finance_Do_Amt"
                type="number"
                title="finance Do Amt."
                value={formData.Finance_Do_Amt}
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8 " />
            </div>
            <div className=" relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Finance_PF_Charge"
                type="number"
                title="finance PF Charge"
                value={formData.Finance_PF_Charge}
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className=" relative lg:col-span-6 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Finance_Payment_Received"
                type="number"
                title="finance Payment Received"
                value={formData.Finance_Payment_Received}
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className="lg:col-span-3 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Los_Number"
                type="text"
                title="Los Number"
                value={formData.Los_Number}
              />
            </div>
            <div className=" relative lg:col-span-3 col-span-12 ">
              <Ainput
                handleInputChange={handleInputChange}
                name="Short_Payment"
                type="number"
                title="Short Payment"
                value={formData.Short_Payment}
                disabled
                className="hover:cursor-not-allowed"
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className="lg:col-span-6 col-span-12 mt-1">
              <Ainput
                handleInputChange={handleInputChange}
                name="Payout_Percentage"
                type="text"
                title="Payout %"
                value={formData.Payout_Percentage}
              />
            </div>
            <div className=" relative lg:col-span-6 col-span-12 mt-1">
              <Ainput
                handleInputChange={handleInputChange}
                name="Gross_Payout"
                type="number"
                title="Gross Payout"
                value={formData.Gross_Payout}
                disabled
                className="hover:cursor-not-allowed"
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className="lg:col-span-3 col-span-12 mt-1">
              <Ainput
                handleInputChange={handleInputChange}
                name="Subvention_Percentage"
                type="text"
                title="Subvention%"
                value={formData.Subvention_Percentage}
              />
            </div>
            <div className=" relative lg:col-span-3 col-span-12 mt-1">
              <Ainput
                handleInputChange={handleInputChange}
                name="Subvention_Amt"
                type="number"
                title="Subvention Amt."
                value={formData.Subvention_Amt}
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className=" relative lg:col-span-6 col-span-12 mt-1">
              <Ainput
                handleInputChange={handleInputChange}
                name="Taxable_Amt"
                type="number"
                title="Taxable Amt."
                redlabel="(Gross - subvention )"
                value={formData.Taxable_Amt}
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className=" relative lg:col-span-3 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Payout_Amt"
                type="number"
                title="Payout Amt."
                value={formData.Payout_Amt}
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className="lg:col-span-3 col-span-12 mt-2">
              <Acheckbox
                label={"GST INCLUDED"}
                handleInputChange={handleCheckboxChange}
              />
            </div>
            <div className=" relative lg:col-span-3 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="GST_Amt"
                type="number"
                title="GST Amt."
                value={formData.GST_Amt}
                disabled
                className="hover:cursor-not-allowed"
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8" />
            </div>
            <div className="lg:col-span-3 col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="GST_Percentage"
                type="text"
                title="GST %"
                value="18"
              />
            </div>
            <div className=" relative col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                name="Net_Payout"
                type="number"
                title="Net Payout"
                value={formData.Net_Payout}
                disabled
                className="hover:cursor-not-allowed"
              />
              <LiaRupeeSignSolid className="absolute top-7 right-2 h-5 w-8 " />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financeform;
