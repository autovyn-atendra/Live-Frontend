"use client";

import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY_COMP_DATA as string;

export const useSecureStorage = () => {
    const [compdata, setData] = useState<any>(null);

    //Encrypt
    const encrypt = (value: any) => {
        try {
            return CryptoJS.AES.encrypt(
                JSON.stringify(value),
                SECRET_KEY
            ).toString();
        } catch (err) {
            console.error("Encrypt error:", err);
            return "";
        }
    };

    //  Decrypt
    const decrypt = (cipherText: string) => {
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            return decrypted ? JSON.parse(decrypted) : null;
        } catch (err) {
            console.error("Decrypt error:", err);
            return null;
        }
    };

    // GET
    const getcompdata = () => {
        const stored = localStorage.getItem("secure_user_data");
        if (!stored) return null;
        return decrypt(stored);
    };

    // SET
    const setcompdata = (value: any) => {
        const filteredData = {
            FinalEmp_Loc: value?.FinalEmp_Loc,
            DemoCarOtp: value?.DemoCar_Otp,
            Banking_Payment_Link: value?.Banking_Payment_Link,
            GP_KM_IMG: value?.GP_KM_IMG,
            FINANCE_PAYMENT_MODE: value?.FINANCE_PAYMENT_MODE,
            FINANCE_DATE: value?.FINANCE_DATE,
            PO_Automail: value?.PO_Automail,
            EmpMasterOtp: value?.EmpMasterOtp,
            TVIICM_DELV_CHALLAN: value?.TVIICM_DELV_CHALLAN,
            TV_SCRAP: value?.TV_SCRAP,
            TV_MODLCODE: value?.TV_MODLCODE,
            Banking_AccountNo_Verify: value?.Banking_AccountNo_Verify,
            Banking_IFSC_Verfy: value?.Banking_IFSC_Verfy,
            Expense_Financial_Posting: value?.Expense_Financial_Posting,
            Digilocker_Linked: value?.Digilocker_Linked,
            Discount_Appr_Column: value?.Discount_Appr_Column,
            FINANCE_GST_INCLUDED: value?.FINANCE_GST_INCLUDED,
            FINANCE_DISABLE_FIELDS: value?.FINANCE_DISABLE_FIELDS,
            Is_Shift_PastDate_Updation: value?.Is_Shift_PastDate_Updation,
            By_Pass_PreInv_Approval: value?.By_Pass_PreInv_Approval,
            Show_Shift_Time: value?.Show_Shift_Time,
            STOCK_INVENTORY_QR_WIDTH: value?.STOCK_INVENTORY_QR_WIDTH,
            STOCK_INVENTORY_QR_HEIGHT: value?.STOCK_INVENTORY_QR_HEIGHT,
            TV_PENDING_EXCESS_AMT: value?.TV_PENDING_EXCESS_AMT,
            IS_ALLOTMENT_ALLOWED_AMOUNT: value?.IS_ALLOTMENT_ALLOWED_AMOUNT,
            IS_OFFER_LAPS: value?.IS_OFFER_LAPS,
            RECEIPT_FLAG: value?.RECEIPT_FLAG,
            MODEL_EDIT_FLAG: value?.MODEL_EDIT_FLAG,
            Print_flag: value?.Print_flag,
            Auto_booking: value?.Auto_booking,
            Whatsapp_Module_Code: value?.Whatsapp_Module_Code,
            IS_ADJUSTMENT: value?.IS_ADJUSTMENT,
            back_date_mipunch_allowed: value?.back_date_mipunch_allowed,
            hide_deal_frz: value?.hide_deal_frz,
            enb_summer_btn: value?.enb_summer_btn,
            QUOTATION_PDF: value?.QUOTATION_PDF,
            DEFAULT_ASSET_CATEGORY_IMAGE: value?.DEFAULT_ASSET_CATEGORY_IMAGE,
            DEFAULT_ASSET_SUBCATEGORY_IMAGE: value?.DEFAULT_ASSET_SUBCATEGORY_IMAGE,
            DEFAULT_ASSET_IMAGE: value?.DEFAULT_ASSET_IMAGE,
            IS_BODYSHOP_GP_PRINT: value?.IS_BODYSHOP_GP_PRINT,
            FINANCE_FINAL_INV_MANDATORY: value?.FINANCE_FINAL_INV_MANDATORY,
            expense_templates: value?.expense_templates,
            Mand_send_ver_message: value?.Mand_send_ver_message,
            disc_open: value?.disc_open,
            mand_SL_Img: value?.mand_SL_Img,
            Show_Attn_Summary: value?.Show_Attn_Summary,
        };

        const encrypted = encrypt(filteredData);
        localStorage.setItem("secure_user_data", encrypted);
        setData(filteredData);
    };

    // ❌ REMOVE
    const removecompdata = () => {
        localStorage.removeItem("secure_user_data");
        setData(null);
    };

    // 🔄 Load on mount
    useEffect(() => {
        const stored = getcompdata();
        if (stored) setData(stored);
    }, []);

    return {
        compdata,     // reactive state
        getcompdata,      // manual get
        setcompdata,      // save encrypted
        removecompdata,   // clear
    };
};
