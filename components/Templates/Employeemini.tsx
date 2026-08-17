"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import AButton from "@/components/atoms/Buttton";
import Acheckbox from "@/components/atoms/Checkbox";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import SmallTitle from "@/components/atoms/smallTitle";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import MediumTitle from "../atoms/MediumTitle";
import axios from "axios";
import { FaUsers } from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";
import HashloaderComponent from "@/components/Templates/hashloader";
import Image from "next/image";

interface EmpMst {
  EMPCODE: string | null;
  MSPIN: string | null;
  TITLE: string | null;
  EMPFIRSTNAME: string | null;
  EMPLASTNAME: string | null;
  PERMANENTADDRESS1: string | null;
  PERMANENTADDRESS2: string | null;
  MOBILE_NO: string | null;
  landline_no: string | null;
  Father_Mob: string | null;
  Mother_Mob: string | null;
  Spouse_Mob: string | null;
  CNATIONALITY: string | null;
  PCITY: number | null;
  PPINCODE: string | null;
  PSTATE: number | null;
  CURRENTADDRESS1: string | null;
  CURRENTADDRESS2: string | null;
  CCITY: number | null;
  CPINCODE: string | null;
  CSTATE: number | null;
  LANDLINENO: string | null;
  MOBILENO: string | null;
  EMERGENCYNAME: string | null;
  EMERGENCYNO: string | null;
  PANNO: string | null;
  PASSPORTNO: string | null;
  PASSEXPIRYDATE: string | null;
  driving_licence: string | null;
  columndoc_type: string | null;
  BLOODGROUP: string | null;
  DOB: string | null;
  GENDER: string | null;
  MARITALSTATUS: string | null;
  DOM: string | null;
  SKILLS: string | null;
  BASICQUALIFICATION: string | null;
  PROFESSIONALQUALIFICATION: string | null;
  FATHERNAME: string | null;
  FATHEROCCUPATION: number | null;
  FATHERCONTACTNO: string | null;
  MOTHERNAME: string | null;
  MOTHERCONTACTNO: string | null;
  SPOUSENAME: string | null;
  SPOUSECONTACTNO: string | null;
  SPOUSEGENDER: string | null;
  SIBLINGNAME: string | null;
  SIBLINGCONTACTNO: string | null;
  PREVIOUSCOMPANYNAME: string | null;
  PRECOMPCITY: number | null;
  PRECOMPCONTACTNO: string | null;
  PREJOININGDATE: string | null;
  PREENDDATE: string | null;
  PREDESIGNATION: string | null;
  EMPREFERENCENAME: string | null;
  REFERENCEDESIGNATION: string | null;
  ISMEDICALATTENTION: string | null;
  ISSERIOUSILLNESS: string | null;
  ISALLERGIES: string | null;
  CORPORATEMAILID: string | null;
  CURRENTJOINDATE: string | null;
  PAYMENTMODE: string | null;
  BANKNAME: string | null;
  BANKACCOUNTNO: string | null;
  EMPLOYEETYPE: string | null;
  ORGANISATIONNAME: string | null;
  SBU_FUNCTION: string | null;
  DIVISION: string | null;
  REGION: number | null;
  UNIT: string | null;
  SECTION: string | null;
  LEVEL: string | null;
  uidno: string | null;
  pfper: number | null;
  esiper: number | null;
  PFNO: string | null;
  ESINO: string | null;
  Ledger_Code: number | null;
  Acnt_Loc: number | null;
  UAN_No: string | null;
  EmpType: number | null;
  IsMSPN: number | null;
  MSPN_DTL: string | null;
  ESI_DEDUCTION: number | null;
  PF_DEDUCTION: number | null;
  pro_tax: number | null;
  TCS_Rate: number | null;
  Rec_Date: string | null;
  ifsc_code: string | null;
  pre_Exp: string | null;
  Interview_Date: string | null;
  Sal_Region: number | null;
  LWFNO: number | null;
  Emp_Ac_Name: string | null;
  PF_Date: string | null;
  ESI_Date: string | null;
  PASSPORT_EXPDATE: string | null;
  Punch_Type: number | null;
  PAY_CODE: string | null;
  Sal_Hold: number | null;
  InBudget: number;
  Induction_Done: number;
  ExitInterview_Done: number;
  LOCATION: string | null;
  ROLE: string | null;
  EMPLOYEEDESIGNATION: string | null;
  GRADE: string | null;
  SUPERVISORID: number | null;
  SUPERVISOR: string | null;
  ISTIMEVALIDATION: string | null;
  ISPAYROLL: string | null;
  PAYCYCLEDURATION: string | null;
  PROBATIONPERIOD: string | null;
  PROBATIONLEAVES: string | null;
  NOTICEPERIOD: string | null;
  RELCODE: number | null;
  Exp_Date: string | null;
  Export_Type: number | null;
  Loc_Code: number | null;
  ServerId: number | null;
  DRIVINGLIC_ISSUEDATE: string | null;
  DRIVINGLIC_ISSUEPALACE: string | null;
  ACCOUNT_TYPE: string | null;
  PFTRUST_NO: string | null;
  EMPHEIGHT: number | null;
  EMPWEIGHT: number | null;
  P_NATIONALITY: string | null;
  UID_NO: string | null;
  ALTERNET_MAIL: string | null;
  EMPDEPENDENT: number | null;
  CHILDREN_DETAIL: string | null;
  LANGUAGE_DETAIL: string | null;
  NOMINEE_DETAIL: number | null;
  EMP_SHIFT: string | null;
  PF: number | null;
  PFSALARY_LIMIT: number | null;
  LWF: number | null;
  ESI_AMOUNT: number | null;
  BONUS_AMOUNT: number | null;
  MONTHLY_CTC: number | null;
  ANNUAL_CTC: number | null;
  COMP_NAME: string | null;
  JOINING_TYPE: string | null;
  BRANCH: string | null;
  EMP_STATUS: string | null;
  USR_NAME: string | null;
  APPLICATION_ID: string | null;
  APPROVED_AUTHO: string | null;
  BIOMETRIC_ID: string | null;
  PROPOSEDRETIRE_DATE: string | null;
  LASTWOR_DATE: string | null;
  RELEVE_STATUS: string | null;
  ADUSER_NAME: string | null;
  EXT_NO: string | null;
  AUTOMAILER: string | null;
  WEEKLYOFF: string | null;
  RESIGN_APPR: string | null;
  AX_EMP_CODE: string | null;
  AX_BAL: number | null;
  Prob_period: string | null;
  empcode2: string | null;
  empcode3: string | null;
  empcode4: string | null;
  ADHARNO: string | null;
  pfnumber: string | null;
  esinumber: string | null;
  ein: string | null;
  mobile_limit: string | null;
  IEMI: string | null;
  IsRW: number | null;
  Reporting_1: string | null;
  Reporting_2: string | null;
  Reporting_3: string | null;
  App_Mispunch: string | null;
  App_Leave: string | null;
  App_Attendance: string | null;
  FCM_TockenId: string | null;
  Android_ID: string | null;
  multi_loc: string | null;
  Token: string | null;
  Is_Profile_Filled: number | null;
  mPunch: string | null;
  mApprove: string | null;
  mMispunch: string | null;
  mLeave: string | null;
  mCalender: string | null;
  mDeviceLog: string | null;
  mAttendanceLog: string | null;
  mLocationLog: string | null;
  mToDoList: string | null;
  mSuggestions: string | null;
  mUpdateIMEI: string | null;
  mTrackingReport: string | null;
  mLiveLocation: string | null;
  mAssetScan: string | null;
  mGeoFenceSetting: string | null;
  Created_by: string | null;
}

interface formData {
  Comp_Code: string | null;
  SrNo: string | null;
  Created_by: string | null;
  EmpMst: EmpMst;
  EmpEdu: object[];
  EmpLang: object[];
  EmpItSkill: object[];
  EmpExperience: object[];
  AssetIssue: object[];
  EmpFamily: object[];
  ImgSourseArray: object[];
  ImgSourseArray1: object[];
  imageSrc: string | null;
  imageSrc1: string | null;
}

export default function Employeemini({ update, setShowTable, setShowForm, refreshTable }) {
  const router = useRouter();
  const user = useCurrentUser();
  const [decsoptin, setDecsoptin] = useState([]);
  const [reporting, setReporting] = useState([]);
  const [location, SetLocation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const getInitialFormData = (): formData => ({
    SrNo: null,
    Created_by: "admin",
    EmpMst: {
      EMPCODE: null,
      MSPIN: null,
      TITLE: null,
      EMPFIRSTNAME: null,
      EMPLASTNAME: null,
      PERMANENTADDRESS1: null,
      PERMANENTADDRESS2: null,
      MOBILE_NO: null,
      landline_no: null,
      Father_Mob: null,
      Mother_Mob: null,
      Spouse_Mob: null,
      CNATIONALITY: null,
      PCITY: null,
      PPINCODE: null,
      PSTATE: null,
      CURRENTADDRESS1: null,
      CURRENTADDRESS2: null,
      CCITY: null,
      CPINCODE: null,
      CSTATE: null,
      LANDLINENO: null,
      MOBILENO: null,
      EMERGENCYNAME: null,
      EMERGENCYNO: null,
      PANNO: null,
      PASSPORTNO: null,
      PASSEXPIRYDATE: null,
      driving_licence: null,
      columndoc_type: null,
      BLOODGROUP: null,
      DOB: null,
      GENDER: null,
      MARITALSTATUS: null,
      DOM: null,
      SKILLS: null,
      BASICQUALIFICATION: null,
      PROFESSIONALQUALIFICATION: null,
      FATHERNAME: null,
      FATHEROCCUPATION: null,
      FATHERCONTACTNO: null,
      MOTHERNAME: null,
      MOTHERCONTACTNO: null,
      SPOUSENAME: null,
      SPOUSECONTACTNO: null,
      SPOUSEGENDER: null,
      SIBLINGNAME: null,
      SIBLINGCONTACTNO: null,
      PREVIOUSCOMPANYNAME: null,
      PRECOMPCITY: null,
      PRECOMPCONTACTNO: null,
      PREJOININGDATE: null,
      PREENDDATE: null,
      PREDESIGNATION: null,
      EMPREFERENCENAME: null,
      REFERENCEDESIGNATION: null,
      ISMEDICALATTENTION: null,
      ISSERIOUSILLNESS: null,
      ISALLERGIES: null,
      CORPORATEMAILID: null,
      Created_by: null,
      CURRENTJOINDATE: null,
      PAYMENTMODE: null,
      BANKNAME: null,
      BANKACCOUNTNO: null,
      EMPLOYEETYPE: null,
      ORGANISATIONNAME: null,
      SBU_FUNCTION: null,
      DIVISION: null,
      REGION: null,
      UNIT: null,
      SECTION: null,
      LEVEL: null,
      uidno: null,
      pfper: null,
      esiper: null,
      PFNO: null,
      ESINO: null,
      Ledger_Code: null,
      Acnt_Loc: null,
      UAN_No: null,
      EmpType: null,
      IsMSPN: null,
      MSPN_DTL: null,
      ESI_DEDUCTION: null,
      PF_DEDUCTION: null,
      pro_tax: null,
      TCS_Rate: null,
      Rec_Date: null,
      ifsc_code: null,
      pre_Exp: null,
      Interview_Date: null,
      Sal_Region: null,
      LWFNO: null,
      Emp_Ac_Name: null,
      PF_Date: null,
      ESI_Date: null,
      PASSPORT_EXPDATE: null,
      Punch_Type: null,
      PAY_CODE: null,
      Sal_Hold: null,
      InBudget: 0,
      Induction_Done: 0,
      ExitInterview_Done: 0,
      LOCATION: null,
      ROLE: null,
      EMPLOYEEDESIGNATION: null,
      GRADE: null,
      SUPERVISORID: null,
      SUPERVISOR: null,
      ISTIMEVALIDATION: null,
      ISPAYROLL: null,
      PAYCYCLEDURATION: null,
      PROBATIONPERIOD: null,
      PROBATIONLEAVES: null,
      NOTICEPERIOD: null,
      RELCODE: null,
      Exp_Date: null,
      Export_Type: 1,
      Loc_Code: null,
      ServerId: 1,
      DRIVINGLIC_ISSUEDATE: null,
      DRIVINGLIC_ISSUEPALACE: null,
      ACCOUNT_TYPE: null,
      PFTRUST_NO: null,
      EMPHEIGHT: null,
      EMPWEIGHT: null,
      P_NATIONALITY: null,
      UID_NO: null,
      ALTERNET_MAIL: null,
      EMPDEPENDENT: null,
      CHILDREN_DETAIL: null,
      LANGUAGE_DETAIL: null,
      NOMINEE_DETAIL: null,
      EMP_SHIFT: null,
      PF: null,
      PFSALARY_LIMIT: null,
      LWF: null,
      ESI_AMOUNT: null,
      BONUS_AMOUNT: null,
      MONTHLY_CTC: null,
      ANNUAL_CTC: null,
      COMP_NAME: null,
      JOINING_TYPE: null,
      BRANCH: null,
      EMP_STATUS: null,
      USR_NAME: null,
      APPLICATION_ID: null,
      APPROVED_AUTHO: null,
      BIOMETRIC_ID: null,
      PROPOSEDRETIRE_DATE: null,
      LASTWOR_DATE: null,
      RELEVE_STATUS: null,
      ADUSER_NAME: null,
      EXT_NO: null,
      AUTOMAILER: null,
      WEEKLYOFF: null,
      RESIGN_APPR: null,
      AX_EMP_CODE: null,
      AX_BAL: null,
      Prob_period: null,
      empcode2: null,
      empcode3: null,
      empcode4: null,
      ADHARNO: null,
      pfnumber: null,
      esinumber: null,
      ein: null,
      mobile_limit: null,
      IEMI: null,
      IsRW: null,
      Reporting_1: null,
      Reporting_2: null,
      Reporting_3: null,
      App_Mispunch: null,
      App_Leave: null,
      App_Attendance: null,
      FCM_TockenId: null,
      Android_ID: null,
      multi_loc: null,
      Token: null,
      Is_Profile_Filled: null,
      mPunch: null,
      mApprove: null,
      mMispunch: null,
      mLeave: null,
      mCalender: null,
      mDeviceLog: null,
      mAttendanceLog: null,
      mLocationLog: null,
      mToDoList: null,
      mSuggestions: null,
      mUpdateIMEI: null,
      mTrackingReport: null,
      mLiveLocation: null,
      mAssetScan: null,
      mGeoFenceSetting: null,
    },
    EmpEdu: [],
    EmpLang: [],
    EmpItSkill: [],
    EmpExperience: [],
    AssetIssue: [],
    EmpFamily: [],
    ImgSourseArray: [],
    ImgSourseArray1: [],
    imageSrc: null,
    imageSrc1: null,
  });


  const [formData, setFormData] = useState<formData>({
    SrNo: null,
    Created_by: "admin",
    EmpMst: {
      EMPCODE: null,
      MSPIN: null,
      TITLE: null,
      EMPFIRSTNAME: null,
      EMPLASTNAME: null,
      PERMANENTADDRESS1: null,
      PERMANENTADDRESS2: null,
      MOBILE_NO: null,
      landline_no: null,
      Father_Mob: null,
      Mother_Mob: null,
      Spouse_Mob: null,
      CNATIONALITY: null,
      PCITY: null,
      PPINCODE: null,
      PSTATE: null,
      CURRENTADDRESS1: null,
      CURRENTADDRESS2: null,
      CCITY: null,
      CPINCODE: null,
      CSTATE: null,
      LANDLINENO: null,
      MOBILENO: null,
      EMERGENCYNAME: null,
      EMERGENCYNO: null,
      PANNO: null,
      PASSPORTNO: null,
      PASSEXPIRYDATE: null,
      driving_licence: null,
      columndoc_type: null,
      BLOODGROUP: null,
      DOB: null,
      GENDER: null,
      MARITALSTATUS: null,
      DOM: null,
      SKILLS: null,
      BASICQUALIFICATION: null,
      PROFESSIONALQUALIFICATION: null,
      FATHERNAME: null,
      FATHEROCCUPATION: null,
      FATHERCONTACTNO: null,
      MOTHERNAME: null,
      MOTHERCONTACTNO: null,
      SPOUSENAME: null,
      SPOUSECONTACTNO: null,
      SPOUSEGENDER: null,
      SIBLINGNAME: null,
      SIBLINGCONTACTNO: null,
      PREVIOUSCOMPANYNAME: null,
      PRECOMPCITY: null,
      PRECOMPCONTACTNO: null,
      PREJOININGDATE: null,
      PREENDDATE: null,
      PREDESIGNATION: null,
      EMPREFERENCENAME: null,
      REFERENCEDESIGNATION: null,
      ISMEDICALATTENTION: null,
      ISSERIOUSILLNESS: null,
      ISALLERGIES: null,
      CORPORATEMAILID: null,
      Created_by: null,
      CURRENTJOINDATE: null,
      PAYMENTMODE: null,
      BANKNAME: null,
      BANKACCOUNTNO: null,
      EMPLOYEETYPE: null,
      ORGANISATIONNAME: null,
      SBU_FUNCTION: null,
      DIVISION: null,
      REGION: null,
      UNIT: null,
      SECTION: null,
      LEVEL: null,
      uidno: null,
      pfper: null,
      esiper: null,
      PFNO: null,
      ESINO: null,
      Ledger_Code: null,
      Acnt_Loc: null,
      UAN_No: null,
      EmpType: null,
      IsMSPN: null,
      MSPN_DTL: null,
      ESI_DEDUCTION: null,
      PF_DEDUCTION: null,
      pro_tax: null,
      TCS_Rate: null,
      Rec_Date: null,
      ifsc_code: null,
      pre_Exp: null,
      Interview_Date: null,
      Sal_Region: null,
      LWFNO: null,
      Emp_Ac_Name: null,
      PF_Date: null,
      ESI_Date: null,
      PASSPORT_EXPDATE: null,
      Punch_Type: null,
      PAY_CODE: null,
      Sal_Hold: null,
      InBudget: 0,
      Induction_Done: 0,
      ExitInterview_Done: 0,
      LOCATION: null,
      ROLE: null,
      EMPLOYEEDESIGNATION: null,
      GRADE: null,
      SUPERVISORID: null,
      SUPERVISOR: null,
      ISTIMEVALIDATION: null,
      ISPAYROLL: null,
      PAYCYCLEDURATION: null,
      PROBATIONPERIOD: null,
      PROBATIONLEAVES: null,
      NOTICEPERIOD: null,
      RELCODE: null,
      Exp_Date: null,
      Export_Type: 1,
      Loc_Code: null,
      ServerId: 1,
      DRIVINGLIC_ISSUEDATE: null,
      DRIVINGLIC_ISSUEPALACE: null,
      ACCOUNT_TYPE: null,
      PFTRUST_NO: null,
      EMPHEIGHT: null,
      EMPWEIGHT: null,
      P_NATIONALITY: null,
      UID_NO: null,
      ALTERNET_MAIL: null,
      EMPDEPENDENT: null,
      CHILDREN_DETAIL: null,
      LANGUAGE_DETAIL: null,
      NOMINEE_DETAIL: null,
      EMP_SHIFT: null,
      PF: null,
      PFSALARY_LIMIT: null,
      LWF: null,
      ESI_AMOUNT: null,
      BONUS_AMOUNT: null,
      MONTHLY_CTC: null,
      ANNUAL_CTC: null,
      COMP_NAME: null,
      JOINING_TYPE: null,
      BRANCH: null,
      EMP_STATUS: null,
      USR_NAME: null,
      APPLICATION_ID: null,
      APPROVED_AUTHO: null,
      BIOMETRIC_ID: null,
      PROPOSEDRETIRE_DATE: null,
      LASTWOR_DATE: null,
      RELEVE_STATUS: null,
      ADUSER_NAME: null,
      EXT_NO: null,
      AUTOMAILER: null,
      WEEKLYOFF: null,
      RESIGN_APPR: null,
      AX_EMP_CODE: null,
      AX_BAL: null,
      Prob_period: null,
      empcode2: null,
      empcode3: null,
      empcode4: null,
      ADHARNO: null,
      pfnumber: null,
      esinumber: null,
      ein: null,
      mobile_limit: null,
      IEMI: null,
      IsRW: null,
      Reporting_1: null,
      Reporting_2: null,
      Reporting_3: null,
      App_Mispunch: null,
      App_Leave: null,
      App_Attendance: null,
      FCM_TockenId: null,
      Android_ID: null,
      multi_loc: null,
      Token: null,
      Is_Profile_Filled: null,
      mPunch: null,
      mApprove: null,
      mMispunch: null,
      mLeave: null,
      mCalender: null,
      mDeviceLog: null,
      mAttendanceLog: null,
      mLocationLog: null,
      mToDoList: null,
      mSuggestions: null,
      mUpdateIMEI: null,
      mTrackingReport: null,
      mLiveLocation: null,
      mAssetScan: null,
      mGeoFenceSetting: null,
    },
    EmpEdu: [],
    EmpLang: [],
    EmpItSkill: [],
    EmpExperience: [],
    AssetIssue: [],
    EmpFamily: [],
    ImgSourseArray: [],
    ImgSourseArray1: [],
    imageSrc: null,
    imageSrc1: null,
  });

  const [showsave, setShowsave] = useState(true);
  const [showupdate, setShowupdate] = useState(false);

  function showSideAlert(message, type) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        container: "side-alert-container",
        popup: `side-alert-${type}`,
        title: "side-alert-title",
        icon: "side-alert-icon",
      },
    });

    Toast.fire({
      icon: type,
      title: message,
    });
  }
  const fetchData = async () => {
    console.log(user?.branch, "sdjbfdnbdf");

    const data = {
      multi_loc12: user?.branch,
      Created_by: user?.name,
    };
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/SmEmplMasters`,
        data,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      if (update) {
        const updateemployee = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/employee/mini/${update.SRNO}`,
          {},
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
            },
          }
        );
        setFormData({
          SrNo: null,
          Created_by: "admin",
          EmpMst: {
            EMPCODE: null,
            MSPIN: null,
            TITLE: null,
            EMPFIRSTNAME: null,
            EMPLASTNAME: null,
            PERMANENTADDRESS1: null,
            PERMANENTADDRESS2: null,
            MOBILE_NO: null,
            landline_no: null,
            Father_Mob: null,
            Mother_Mob: null,
            Spouse_Mob: null,
            CNATIONALITY: null,
            PCITY: null,
            PPINCODE: null,
            PSTATE: null,
            CURRENTADDRESS1: null,
            CURRENTADDRESS2: null,
            CCITY: null,
            CPINCODE: null,
            CSTATE: null,
            LANDLINENO: null,
            MOBILENO: null,
            EMERGENCYNAME: null,
            EMERGENCYNO: null,
            PANNO: null,
            PASSPORTNO: null,
            PASSEXPIRYDATE: null,
            driving_licence: null,
            columndoc_type: null,
            BLOODGROUP: null,
            DOB: null,
            GENDER: null,
            MARITALSTATUS: null,
            DOM: null,
            SKILLS: null,
            BASICQUALIFICATION: null,
            PROFESSIONALQUALIFICATION: null,
            FATHERNAME: null,
            FATHEROCCUPATION: null,
            FATHERCONTACTNO: null,
            MOTHERNAME: null,
            MOTHERCONTACTNO: null,
            SPOUSENAME: null,
            SPOUSECONTACTNO: null,
            SPOUSEGENDER: null,
            SIBLINGNAME: null,
            SIBLINGCONTACTNO: null,
            PREVIOUSCOMPANYNAME: null,
            PRECOMPCITY: null,
            PRECOMPCONTACTNO: null,
            PREJOININGDATE: null,
            PREENDDATE: null,
            PREDESIGNATION: null,
            EMPREFERENCENAME: null,
            REFERENCEDESIGNATION: null,
            ISMEDICALATTENTION: null,
            ISSERIOUSILLNESS: null,
            ISALLERGIES: null,
            CORPORATEMAILID: null,
            Created_by: null,
            CURRENTJOINDATE: null,
            PAYMENTMODE: null,
            BANKNAME: null,
            BANKACCOUNTNO: null,
            EMPLOYEETYPE: null,
            ORGANISATIONNAME: null,
            SBU_FUNCTION: null,
            DIVISION: null,
            REGION: null,
            UNIT: null,
            SECTION: null,
            LEVEL: null,
            uidno: null,
            pfper: null,
            esiper: null,
            PFNO: null,
            ESINO: null,
            Ledger_Code: null,
            Acnt_Loc: null,
            UAN_No: null,
            EmpType: null,
            IsMSPN: null,
            MSPN_DTL: null,
            ESI_DEDUCTION: null,
            PF_DEDUCTION: null,
            pro_tax: null,
            TCS_Rate: null,
            Rec_Date: null,
            ifsc_code: null,
            pre_Exp: null,
            Interview_Date: null,
            Sal_Region: null,
            LWFNO: null,
            Emp_Ac_Name: null,
            PF_Date: null,
            ESI_Date: null,
            PASSPORT_EXPDATE: null,
            Punch_Type: null,
            PAY_CODE: null,
            Sal_Hold: null,
            InBudget: 0,
            Induction_Done: 0,
            ExitInterview_Done: 0,
            LOCATION: null,
            ROLE: null,
            EMPLOYEEDESIGNATION: null,
            GRADE: null,
            SUPERVISORID: null,
            SUPERVISOR: null,
            ISTIMEVALIDATION: null,
            ISPAYROLL: null,
            PAYCYCLEDURATION: null,
            PROBATIONPERIOD: null,
            PROBATIONLEAVES: null,
            NOTICEPERIOD: null,
            RELCODE: null,
            Exp_Date: null,
            Export_Type: 1,
            Loc_Code: null,
            ServerId: 1,
            DRIVINGLIC_ISSUEDATE: null,
            DRIVINGLIC_ISSUEPALACE: null,
            ACCOUNT_TYPE: null,
            PFTRUST_NO: null,
            EMPHEIGHT: null,
            EMPWEIGHT: null,
            P_NATIONALITY: null,
            UID_NO: null,
            ALTERNET_MAIL: null,
            EMPDEPENDENT: null,
            CHILDREN_DETAIL: null,
            LANGUAGE_DETAIL: null,
            NOMINEE_DETAIL: null,
            EMP_SHIFT: null,
            PF: null,
            PFSALARY_LIMIT: null,
            LWF: null,
            ESI_AMOUNT: null,
            BONUS_AMOUNT: null,
            MONTHLY_CTC: null,
            ANNUAL_CTC: null,
            COMP_NAME: null,
            JOINING_TYPE: null,
            BRANCH: null,
            EMP_STATUS: null,
            USR_NAME: null,
            APPLICATION_ID: null,
            APPROVED_AUTHO: null,
            BIOMETRIC_ID: null,
            PROPOSEDRETIRE_DATE: null,
            LASTWOR_DATE: null,
            RELEVE_STATUS: null,
            ADUSER_NAME: null,
            EXT_NO: null,
            AUTOMAILER: null,
            WEEKLYOFF: null,
            RESIGN_APPR: null,
            AX_EMP_CODE: null,
            AX_BAL: null,
            Prob_period: null,
            empcode2: null,
            empcode3: null,
            empcode4: null,
            ADHARNO: null,
            pfnumber: null,
            esinumber: null,
            ein: null,
            mobile_limit: null,
            IEMI: null,
            IsRW: null,
            Reporting_1: null,
            Reporting_2: null,
            Reporting_3: null,
            App_Mispunch: null,
            App_Leave: null,
            App_Attendance: null,
            FCM_TockenId: null,
            Android_ID: null,
            multi_loc: null,
            Token: null,
            Is_Profile_Filled: null,
            mPunch: null,
            mApprove: null,
            mMispunch: null,
            mLeave: null,
            mCalender: null,
            mDeviceLog: null,
            mAttendanceLog: null,
            mLocationLog: null,
            mToDoList: null,
            mSuggestions: null,
            mUpdateIMEI: null,
            mTrackingReport: null,
            mLiveLocation: null,
            mAssetScan: null,
            mGeoFenceSetting: null,
          },
          EmpEdu: [],
          EmpLang: [],
          EmpItSkill: [],
          EmpExperience: [],
          AssetIssue: [],
          EmpFamily: [],
          ImgSourseArray: [],
          ImgSourseArray1: [],
          imageSrc: null,
          imageSrc1: null,
        });

        console.log(updateemployee, "sajs");
        setFormData((prevData) => ({
          ...prevData,
          ...updateemployee.data.data,
        }));
        setShowsave(false);
        setShowupdate(true);
      }
      console.log(response, "sjsj");

      const option = response.data.data;
      setDecsoptin(option.EMPLOYEEDESIGNATION);
      setReporting(option.EMPL);
      SetLocation(option.LOCATION);
    } catch (error) {
      // Handle the error here
      console.error("An error occurred while fetching data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, [update]);

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      EmpMst: {
        ...prevData.EmpMst,
        [name]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (formData.EmpMst.EMPCODE == null || formData.EmpMst.EMPCODE == "") {
      showSideAlert("Enter EmployeeCode", "error");
      return;
    } else if (
      formData.EmpMst.EMPFIRSTNAME == null ||
      formData.EmpMst.EMPFIRSTNAME == ""
    ) {
      showSideAlert("Enter Employee First Name", "error");
      return;
    } else if (
      formData.EmpMst.EMPLASTNAME == null ||
      formData.EmpMst.EMPLASTNAME == ""
    ) {
      showSideAlert("Enter Employee Last Name", "error");
      return;
    } else if (
      formData.EmpMst.LOCATION == null ||
      formData.EmpMst.LOCATION == ""
    ) {
      showSideAlert("Enter Employee Location", "error");
      return;
    } else if (
      formData.EmpMst.MOBILE_NO == null ||
      formData.EmpMst.MOBILE_NO == "" ||
      formData.EmpMst.MOBILE_NO.length > 12 ||
      formData.EmpMst.MOBILE_NO.length < 0
    ) {
      showSideAlert("Enter Correct Mobile Number", "error");
      return;
    } else {
      try {
        setIsLoading(true);
        await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/employee/savemini`,
          formData,
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
            },
          }
        );
        showSideAlert("Employee Created Successfully", "success");
        setFormData({
          SrNo: null,
          Created_by: "admin",
          EmpMst: {
            EMPCODE: null,
            MSPIN: null,
            TITLE: null,
            EMPFIRSTNAME: null,
            EMPLASTNAME: null,
            PERMANENTADDRESS1: null,
            PERMANENTADDRESS2: null,
            MOBILE_NO: null,
            landline_no: null,
            Father_Mob: null,
            Mother_Mob: null,
            Spouse_Mob: null,
            CNATIONALITY: null,
            PCITY: null,
            PPINCODE: null,
            PSTATE: null,
            CURRENTADDRESS1: null,
            CURRENTADDRESS2: null,
            CCITY: null,
            CPINCODE: null,
            CSTATE: null,
            LANDLINENO: null,
            MOBILENO: null,
            EMERGENCYNAME: null,
            EMERGENCYNO: null,
            PANNO: null,
            PASSPORTNO: null,
            PASSEXPIRYDATE: null,
            driving_licence: null,
            columndoc_type: null,
            BLOODGROUP: null,
            DOB: null,
            GENDER: null,
            MARITALSTATUS: null,
            DOM: null,
            SKILLS: null,
            BASICQUALIFICATION: null,
            PROFESSIONALQUALIFICATION: null,
            FATHERNAME: null,
            FATHEROCCUPATION: null,
            FATHERCONTACTNO: null,
            MOTHERNAME: null,
            MOTHERCONTACTNO: null,
            SPOUSENAME: null,
            SPOUSECONTACTNO: null,
            SPOUSEGENDER: null,
            SIBLINGNAME: null,
            SIBLINGCONTACTNO: null,
            PREVIOUSCOMPANYNAME: null,
            PRECOMPCITY: null,
            PRECOMPCONTACTNO: null,
            PREJOININGDATE: null,
            PREENDDATE: null,
            PREDESIGNATION: null,
            EMPREFERENCENAME: null,
            REFERENCEDESIGNATION: null,
            ISMEDICALATTENTION: null,
            ISSERIOUSILLNESS: null,
            ISALLERGIES: null,
            CORPORATEMAILID: null,
            Created_by: null,
            CURRENTJOINDATE: null,
            PAYMENTMODE: null,
            BANKNAME: null,
            BANKACCOUNTNO: null,
            EMPLOYEETYPE: null,
            ORGANISATIONNAME: null,
            SBU_FUNCTION: null,
            DIVISION: null,
            REGION: null,
            UNIT: null,
            SECTION: null,
            LEVEL: null,
            uidno: null,
            pfper: null,
            esiper: null,
            PFNO: null,
            ESINO: null,
            Ledger_Code: null,
            Acnt_Loc: null,
            UAN_No: null,
            EmpType: null,
            IsMSPN: null,
            MSPN_DTL: null,
            ESI_DEDUCTION: null,
            PF_DEDUCTION: null,
            pro_tax: null,
            TCS_Rate: null,
            Rec_Date: null,
            ifsc_code: null,
            pre_Exp: null,
            Interview_Date: null,
            Sal_Region: null,
            LWFNO: null,
            Emp_Ac_Name: null,
            PF_Date: null,
            ESI_Date: null,
            PASSPORT_EXPDATE: null,
            Punch_Type: null,
            PAY_CODE: null,
            Sal_Hold: null,
            InBudget: 0,
            Induction_Done: 0,
            ExitInterview_Done: 0,
            LOCATION: null,
            ROLE: null,
            EMPLOYEEDESIGNATION: null,
            GRADE: null,
            SUPERVISORID: null,
            SUPERVISOR: null,
            ISTIMEVALIDATION: null,
            ISPAYROLL: null,
            PAYCYCLEDURATION: null,
            PROBATIONPERIOD: null,
            PROBATIONLEAVES: null,
            NOTICEPERIOD: null,
            RELCODE: null,
            Exp_Date: null,
            Export_Type: 1,
            Loc_Code: null,
            ServerId: 1,
            DRIVINGLIC_ISSUEDATE: null,
            DRIVINGLIC_ISSUEPALACE: null,
            ACCOUNT_TYPE: null,
            PFTRUST_NO: null,
            EMPHEIGHT: null,
            EMPWEIGHT: null,
            P_NATIONALITY: null,
            UID_NO: null,
            ALTERNET_MAIL: null,
            EMPDEPENDENT: null,
            CHILDREN_DETAIL: null,
            LANGUAGE_DETAIL: null,
            NOMINEE_DETAIL: null,
            EMP_SHIFT: null,
            PF: null,
            PFSALARY_LIMIT: null,
            LWF: null,
            ESI_AMOUNT: null,
            BONUS_AMOUNT: null,
            MONTHLY_CTC: null,
            ANNUAL_CTC: null,
            COMP_NAME: null,
            JOINING_TYPE: null,
            BRANCH: null,
            EMP_STATUS: null,
            USR_NAME: null,
            APPLICATION_ID: null,
            APPROVED_AUTHO: null,
            BIOMETRIC_ID: null,
            PROPOSEDRETIRE_DATE: null,
            LASTWOR_DATE: null,
            RELEVE_STATUS: null,
            ADUSER_NAME: null,
            EXT_NO: null,
            AUTOMAILER: null,
            WEEKLYOFF: null,
            RESIGN_APPR: null,
            AX_EMP_CODE: null,
            AX_BAL: null,
            Prob_period: null,
            empcode2: null,
            empcode3: null,
            empcode4: null,
            ADHARNO: null,
            pfnumber: null,
            esinumber: null,
            ein: null,
            mobile_limit: null,
            IEMI: null,
            IsRW: null,
            Reporting_1: null,
            Reporting_2: null,
            Reporting_3: null,
            App_Mispunch: null,
            App_Leave: null,
            App_Attendance: null,
            FCM_TockenId: null,
            Android_ID: null,
            multi_loc: null,
            Token: null,
            Is_Profile_Filled: null,
            mPunch: null,
            mApprove: null,
            mMispunch: null,
            mLeave: null,
            mCalender: null,
            mDeviceLog: null,
            mAttendanceLog: null,
            mLocationLog: null,
            mToDoList: null,
            mSuggestions: null,
            mUpdateIMEI: null,
            mTrackingReport: null,
            mLiveLocation: null,
            mAssetScan: null,
            mGeoFenceSetting: null,
          },
          EmpEdu: [],
          EmpLang: [],
          EmpItSkill: [],
          EmpExperience: [],
          AssetIssue: [],
          EmpFamily: [],
          ImgSourseArray: [],
          ImgSourseArray1: [],
          imageSrc: null,
          imageSrc1: null,
        });
      } catch (error) {
        // Log the error or handle it appropriately
        console.error(
          "Error occurred during  post:",
          error.response.data.Message
        );
        showSideAlert(
          `${error.response.data.Message
            ? error.response.data.Message
            : "An error occurred while creating the employee"
          }`,
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleback = () => {
    setShowTable(true);
    setShowForm(false);
  };

  function formatErrorMessage(errorDetails) {
    console.log(errorDetails, "");
    const formattedErrorDetails = errorDetails
      .split(", ")
      .map((detail) => `"${detail}"`)
      .join(", ");

    return `${formattedErrorDetails}`;
  }

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/updatemini/${formData.EmpMst.SRNO}`,
        formData,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      showSideAlert("Employee Updated Successfully", "success");
      await refreshTable()
      handleback()
    } catch (error) {
      let errorMessage = "An error occurred while creating the employee";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        // Extract the error message from the response data
        const errorDetails = error.response.data.message;
        errorMessage = formatErrorMessage(errorDetails);
      }

      console.error("Error occurred during  post:", error);
      showSideAlert(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };
  const [IsGenerate, setIsGenerate] = useState(false);
  const Generatecode = async () => {
    setFormData(getInitialFormData());
    setIsGenerate(false);

    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/generateCode`,
        {
          branch: user?.branch,
        },
        {
          headers: { compcode: user?.Comp_Code },
        }
      );

      console.log(result, "ViewData");
      if (result.status === 201) {
        await Swal.fire({
          icon: "error",
          title: result.data.message,
          text: "",
        });
        router.back();
        return;
      }

      const code = result?.data?.code;
      console.log(code, "code");
      setFormData((prev) => ({
        ...prev,
        EmpMst: {
          ...prev.EmpMst,
          EMPCODE: code,
        },
      }));
      setIsGenerate(true);
    } catch (error) {
      console.error("Error", error);
      // showSideAlert(`${error?.response?.data?.message}`, "error");

      Swal.fire({
        icon: "error",
        title: `${error?.response?.data?.message}`,
        text: " ...",
      });
    }
  };

  useEffect(() => {
    // Check if update exists, otherwise treat as empty object
    const updateLength = update ? Object.keys(update).length : 0;
    console.log("Update object length:", updateLength);

    if (!update || updateLength === 0) {
      console.log("Adding new employee → generating code");
      Generatecode();
    }
  }, [update]);

  const handleLocationChange = async (name: string, value: string | number) => {
    handleInputChange(name, value); // update location in formData

    if ((name === "LOCATION") && value && !showupdate && showsave) {
      await Generatecodeforlocation(value);
    }
  };

  const Generatecodeforlocation = async (location) => {
    try {
      if (!location) {
        await Swal.fire({
          icon: "warning",
          title: "Please select a location before generating the code.",
        });
        return;
      }

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/generateCode`,
        { branch: location },
        { headers: { compcode: user?.Comp_Code } }
      );
      if (result.status === 201) {
        await Swal.fire({
          icon: "error",
          title: result.data.message,
        });
        return;
      }

      const code = result?.data?.code;

      setFormData((prev) => ({
        ...prev,
        EmpMst: {
          ...prev.EmpMst,
          EMPCODE: code,
        },
      }));

      setIsGenerate(true);
    } catch (error) {
      console.error("Error generating code:", error);

      await Swal.fire({
        icon: "error",
        title: error?.response?.data?.message || "Failed to generate code",
      });
    }
  };



  return (
    <div className="grid grid-cols-12 p-2 gap-2 px-0">

      <div className="col-span-12 md:col-span-12 lg:col-span-12 ">
        <div className="">
          <div className="rounded-t bg-[#193A69] dark:bg-black px-6 py-1 border dark:border-[#D0D5DD] mb-2  sm:flex sm:items-center sm:justify-between sm:gap-4 gap-3">
            <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3">
              <Image src="/Payrollicon/EmployeeMaster.png" alt="Autovyn" width={25} height={25} />
              Employee Master
            </h1>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
              {showsave && (
                <>
                  <Button variant={"save"} onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant={"print"} onClick={() => history.back()}>
                    Back
                  </Button>
                </>
              )}
              {showupdate && (
                <>
                  <Button variant={"update"} onClick={handleUpdate}>
                    Update
                  </Button>
                  <Button variant={"print"} onClick={handleback}>
                    Back
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* ─── EMPLOYEE BASIC DETAILS ─── */}
          <div className="grid grid-cols-12 p-4 gap-4 mt-2  rounded-b  bg-white dark:bg-black border border-[#b5bfcb] dark:border-[#D0D5DD] shadow">

            {/* Emp. Code */}
              {showsave ? (<div className="col-span-12 md:col-span-2">
                <Ainput
                  type="text"
                  title="Emp. Code"
                  name="EMPCODE"
                  value={formData?.EmpMst?.EMPCODE || ""}
                  handleInputChange={handleInputChange}
                  redlabel="*"
                  disabled={IsGenerate || showupdate}
                />
              </div>) : (
                <div className="col-span-12 md:col-span-4">
                  <Ainput
                    type="text"
                    title="Emp. Code"
                    name="EMPCODE"
                    value={formData?.EmpMst?.EMPCODE || ""}
                    handleInputChange={handleInputChange}
                    redlabel="*"
                    disabled={IsGenerate || showupdate}
                  />
                </div>
              )}

            {/* Generate Code Button */}
            {showsave && (
              <div className="col-span-12 md:col-span-2">
                <Button
                  variant="save"
                  onClick={Generatecode}
                  className="w-full h-9 mt-6 text-[12px]"
                >
                  Generate New Code
                </Button>
              </div>
            )}

            {/* First Name */}
            <div className="col-span-12 md:col-span-4">
              <Ainput
                type="text"
                title="First Name"
                name="EMPFIRSTNAME"
                value={formData?.EmpMst?.EMPFIRSTNAME || ""}
                handleInputChange={handleInputChange}
                redlabel="*"
              />
            </div>

            {/* Last Name */}
            <div className="col-span-12 md:col-span-4">
              <Ainput
                type="text"
                title="Last Name"
                name="EMPLASTNAME"
                value={formData?.EmpMst?.EMPLASTNAME || ""}
                handleInputChange={handleInputChange}
                redlabel="*"
              />
            </div>

            {/* Designation */}
            <div className="col-span-12 md:col-span-4">
              <SelectSearch
                options={decsoptin}
                title="Designation"
                name="EMPLOYEEDESIGNATION"
                selectedValue={
                  formData?.EmpMst?.EMPLOYEEDESIGNATION?.toString() || null
                }
                handleInputChange={handleInputChange}
              />
            </div>

            {/* Location */}
            <div className="col-span-12 md:col-span-4">
              <SelectSearch
                options={location}
                title="Location"
                name="LOCATION"
                selectedValue={formData?.EmpMst?.LOCATION?.toString() || null}
                handleInputChange={handleLocationChange}
                redlabel="*"
              />
            </div>

            {/* Email */}
            <div className="col-span-12 md:col-span-4">
              <Ainput
                type="email"
                title="Email"
                name="CORPORATEMAILID"
                value={formData?.EmpMst?.CORPORATEMAILID || ""}
                handleInputChange={handleInputChange}
              />
            </div>

            <div className="col-span-12 md:col-span-2">
              <Ainput
                type="number"
                title="Mobile Number"
                name="MOBILE_NO"
                value={formData?.EmpMst?.MOBILE_NO || ""}
                handleInputChange={handleInputChange}
                redlabel="*"
              />
            </div>



            {/* MSPIN */}
            <div className="col-span-12 md:col-span-2">
              <Ainput
                type="text"
                title="MSPIN"
                name="MSPIN"
                value={formData?.EmpMst?.MSPIN || ""}
                handleInputChange={handleInputChange}
                ShortName
              />
            </div>

            {/* Reporting 1 */}
            <div className="col-span-12 md:col-span-4">
              <SelectSearch
                options={reporting}
                title="Reporting 1"
                name="Reporting_1"
                selectedValue={
                  formData?.EmpMst?.Reporting_1?.toString() || null
                }
                handleInputChange={handleInputChange}
              />
            </div>

            {/* Reporting 2 */}
            <div className="col-span-12 md:col-span-4 ">
              <SelectSearch
                options={reporting}
                title="Reporting 2"
                name="Reporting_2"
                selectedValue={
                  formData?.EmpMst?.Reporting_2?.toString() || null
                }
                handleInputChange={handleInputChange}
              />
            </div>

            {/* Reporting 3 */}
            <div className="col-span-12 md:col-span-4">
              <SelectSearch
                options={reporting}
                title="Reporting 3"
                name="Reporting_3"
                selectedValue={
                  formData?.EmpMst?.Reporting_3?.toString() || null
                }
                handleInputChange={handleInputChange}
              />
            </div>
          </div>

          {/* <div className="relative border border-dark dark:border-white rounded mt-6 px-4 pt-6 pb-4">
            <div className="absolute -top-3 left-6 bg-[#fccb82] dark:bg-gray-900 uppercase px-2 text-sm font-semibold text-gray-700 dark:text-[#0f172a] rounded-full">
              Employee Contact & Reporting Details
            </div>
            <div className="grid grid-cols-12 gap-4 mt-2">
              
             
            </div>
          </div> */}

          {/* <div className="grid grid-cols-12">
            <div className="col-span-4"></div>
            <div className="col-span-8">
              <div className="grid grid-cols-12 gap-0">
                <div className="col-span-4"></div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
