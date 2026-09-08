"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import Eselect from "@/components/atoms/Eselect";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import Image from "next/image";
import Swal from "sweetalert2";
import { CheckCircle, FileText, History, HistoryIcon, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Static options                                                     */
/* ------------------------------------------------------------------ */
const INDUSTRIES = [
  { value: "IT / Software", label: "IT / Software" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Retail", label: "Retail" },
  { value: "Finance & Banking", label: "Finance & Banking" },
  { value: "Logistics & Transport", label: "Logistics & Transport" },
  { value: "Education", label: "Education" },
  { value: "Hospitality", label: "Hospitality" },
  { value: "Construction", label: "Construction" },
  { value: "Pharmaceuticals", label: "Pharmaceuticals" },
  { value: "Telecom", label: "Telecom" },
  { value: "Media & Entertainment", label: "Media & Entertainment" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Other", label: "Other" },
];

/* Plan options (hardcoded) */
const PLAN_OPTIONS = [
  { value: 1, label: "Standard Plan" },   // pre-selected + locked, add-ons allowed
  { value: 2, label: "Growth Package" },  // everything selected + locked
  { value: 3, label: "Enterprise Plan" }, // free pick
  { value: 4, label: "Import Attendance Plan" }, // free pick
];

/* Quotation types (hardcoded). Values are strings so Eselect's initialValue
   matching (which only recognizes string/array/object initialValue) can
   correctly highlight the active option; handleChange coerces back to a
   number so form.QuotationType stays numeric everywhere else. */
const QUOTATION_TYPES = [
  { value: "1", label: "Payroll & HRMS" },
  { value: "2", label: "Demo Car" },
];

const DEMO_CAR_RANGE_CODE = "999"; // matches EMP_RANGE_CODE=999 in HRSetu_ModulePrice for demo car flat pricing

/* Employee ranges come from DB master (Misc_Mst, Misc_Type = 674).
   We store Misc_Code in EMPLOYEE_COUNT and show Misc_Name.
   The same Misc_Code is the EMP_RANGE_CODE used for module pricing. */

const EMPTY_FORM = {
  Company: "", Industry: "", Employees: "", Stakeholder: "", Designation: "",
  Email: "", Mobile: "", Headquarters: "", Legacy: "", GstNo: "", Status: "draft",
  QuotationType: 1, DemoCarCount: "",
};

const LEGACY_MAX = 500;

const STATUS_MAP: Record<string, { txt: string; cls: string }> = {
  sent: { txt: "Quotation Sent", cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  pending: { txt: "Pending", cls: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  draft: { txt: "Draft", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300" },
};

/* map between frontend form keys <-> backend column keys */
const toApi = (f: any, utd?: any) => ({
  ...(utd ? { UTD: utd } : {}),
  COMPANY_NAME: f.Company, INDUSTRY: f.Industry, EMPLOYEE_COUNT: f.Employees,
  STAKEHOLDER_NAME: f.Stakeholder, DESIGNATION: f.Designation, EMAIL: f.Email,
  MOBILE: f.Mobile, HEADQUARTERS: f.Headquarters, LEGACY_CONTEXT: f.Legacy, GST_NO: f.GstNo,
  STATUS: f.Status || "draft",
  QUOTATION_TYPE: f.QuotationType,
  DEMO_CAR_COUNT: f.QuotationType === 2 ? f.DemoCarCount : null,
});
const fromApi = (r: any) => ({
  UTD: r.UTD, Company: r.COMPANY_NAME || "", Industry: r.INDUSTRY || "",
  Employees: r.EMPLOYEE_COUNT || "", Stakeholder: r.STAKEHOLDER_NAME || "",
  Designation: r.DESIGNATION || "", Email: r.EMAIL || "", Mobile: r.MOBILE || "",
  Headquarters: r.HEADQUARTERS || "", Legacy: r.LEGACY_CONTEXT || "", GstNo: r.GST_NO || "", Status: r.STATUS || "draft",
  PdfPath: r.PDF_PATH || "",
  QuotationType: Number(r.QUOTATION_TYPE) || 1,
  DemoCarCount: r.DEMO_CAR_COUNT != null ? String(r.DEMO_CAR_COUNT) : "",
});

/* ------------------------------------------------------------------ */
/* Inline icons                                                       */
/* ------------------------------------------------------------------ */
const IcoQuote = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);
const IcoEdit = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);
const IcoTrash = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IcoSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" /></svg>
);
const IcoPrint = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M18 9H6" />
    <path d="M6 14H18" />
    <path d="M6 18H18" />
    <rect x="6" y="9" width="12" height="13" rx="1" ry="1" />
  </svg>
);

function showSideAlert(message: any, type: any) {
  const Toast = Swal.mixin({
    toast: true, position: "top-end", showConfirmButton: false,
    timer: 3000, timerProgressBar: true,
    customClass: { container: "side-alert-container", popup: `side-alert-${type}`, title: "side-alert-title", icon: "side-alert-icon" },
  });
  Toast.fire({ icon: type, title: message });
}

/* ================================================================== */
function ClientIntakeContent() {
  const user = useCurrentUser();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const [signatory, setSignatory] = useState<any>(null);
  const reqHeaders = { headers: { compcode: (user as any)?.Comp_Code, name: (user as any)?.name } };

  const [view, setView] = useState<"list" | "form" | "modules" | "preview">("list");
  const [clients, setClients] = useState<any[]>([]);
  const [empRanges, setEmpRanges] = useState<any[]>([]); // Misc 674: {Misc_Code, Misc_Name, Misc_HOD}

  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<any>({});
  const [editUTD, setEditUTD] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [priceByRange, setPriceByRange] = useState<Record<string, Record<string, number>>>({}); // { rangeCode: { tag: price } }


  /* ---- step-2 state ---- */
  const [clientUTD, setClientUTD] = useState<any>(null);   // client this quotation belongs to
  const [clientEmployees, setClientEmployees] = useState<string>("");
  const [modules, setModules] = useState<any[]>([]);
  const [priceByTag, setPriceByTag] = useState<Record<string, number>>({});
  const [plan, setPlan] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [step2Exists, setStep2Exists] = useState<boolean>(false); // existing step-2 -> update
  const [paymentTerms, setPaymentTerms] = useState<any[]>([]); // Misc 675
  const [paymentTerm, setPaymentTerm] = useState<string>("");  // selected Misc_Code
  const [masterTerms, setMasterTerms] = useState<any[]>([]);          // [{code, text}]
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);  // ["TERMS1","TERMS2"]
  const [optionalTerms, setOptionalTerms] = useState<string[]>(["", "", "", "", ""]);
  const [actPerEmpRate, setActPerEmpRate] = useState<string>("");   // editable per-emp rate (preview)
  const [customDiscount, setCustomDiscount] = useState<string>(""); // manual discount %
  const [oneTimeSetup, setOneTimeSetup] = useState<string>("5000");
  const [oneTimeDiscount, setOneTimeDiscount] = useState<string>("5000");
  const [quotPrefix, setQuotPrefix] = useState<string>("");
  const [quotNo, setQuotNo] = useState<number | null>(null);

  const [userTouchedRate, setUserTouchedRate] = useState(false);


  const [rateSaved, setRateSaved] = useState(false);
  const TERMS_DELIM = "~~~";
  // New state for employee wise cost
  const [employeeWiseCost, setEmployeeWiseCost] = useState({
    isEmployeeWise: "No", // "Yes" or "No"
    exactEmployeeCount: ""
  });

  const isEdit = editUTD !== null && editUTD !== undefined;
  const isDemoCar = form.QuotationType === 2;

  // code -> name map for displaying the employee range
  const empRangeMap: Record<string, string> = {};
  empRanges.forEach((r: any) => { empRangeMap[String(r.Misc_Code)] = r.Misc_Name; });

  const fetchModules = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getModules`,
        { LINK_UTD: clientUTD },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (res.data?.Status && res.data?.Data) {
        const sortedModules = (res.data.Data || []).sort((a: any, b: any) => {
          if ((a.PARENT_TAG || '') !== (b.PARENT_TAG || '')) {
            return (a.PARENT_TAG || '').localeCompare(b.PARENT_TAG || '');
          }
          return (a.SEQ_NO || 0) - (b.SEQ_NO || 0);
        });
        setModules(sortedModules);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };
  const generateModuleHTML = (modules: any[], selectedTags: Set<string>, isDemoCar?: boolean) => {
    if (modules.length === 0) return "";

    const MODULE_NAME = isDemoCar ? "Demo Car Program" : "HRMS & Payroll Management System";

    const mainModules = modules.filter(
      (m: any) => !m.PARENT_TAG && m.IS_HEADER
    );

    let html =
      '<table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #1f2937;">';

    html += `
    <thead>
      <tr style="background:#193A69;color:#fff;">
        <th style="padding:12px 12px;border:1px solid #1f2937;width:30%;text-align:left;">
          Modules
        </th>
        <th style="padding:12px 12px;border:1px solid #1f2937;text-align:left;">
          Particulars
        </th>
      </tr>
    </thead>
    <tbody>
  `;

    let allParticulars = "";

    mainModules
      .sort((a: any, b: any) => parseFloat(a.TAG) - parseFloat(b.TAG))
      .forEach((mainHeader: any) => {

        const headerSelected = selectedTags.has(String(mainHeader.TAG));

        const childModules = modules
          .filter(
            (m: any) =>
              m.PARENT_TAG === mainHeader.TAG &&
              m.IS_HEADER !== true &&
              selectedTags.has(String(m.TAG))
          )
          .sort((a: any, b: any) => {
            const aParts = String(a.TAG).split(".");
            const bParts = String(b.TAG).split(".");
            const aNum = parseFloat(`${aParts[0]}.${aParts[1] || 0}`);
            const bNum = parseFloat(`${bParts[0]}.${bParts[1] || 0}`);
            return aNum - bNum;
          });

        // Agar heading bhi select nahi aur koi child bhi select nahi
        if (!headerSelected && childModules.length === 0) {
          return;
        }

        if (allParticulars !== "") {
          allParticulars += "<br/><br/>";
        }

        // Heading
        allParticulars += `<b>${mainHeader.MODULE_NAME}</b>`;

        // Children
        if (childModules.length > 0) {
          allParticulars += "<br/>";
          allParticulars += childModules
            .map(
              (m: any) =>
                `<span style="display:inline-block;padding-left:20px;">● ${m.MODULE_NAME}</span>`
            )
            .join("<br/>");
        }
      });

    html += `
    <tr>
      <td style="padding:16px 12px;border:1px solid #1f2937;vertical-align:top;font-weight:bold;background:#f3f8fc;">
        ${MODULE_NAME}
      </td>

      <td style="padding:16px 12px;border:1px solid #1f2937;vertical-align:top;">
        ${allParticulars || "—"}
      </td>
    </tr>
  `;

    html += "</tbody></table>";

    return html;
  };
  const fetchPaymentTerms = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/getPaymentTerms`, {}, reqHeaders);
      if (res.data?.Status) {
        const list = res.data.Data || [];
        setPaymentTerms(list);
        if (list.length && !paymentTerm) setPaymentTerm(String(list[0].Misc_Code)); // default Monthly
      }
    } catch (e) { console.error(e); }
  };

  const GST_RATE = 18;
  const computeBreakdown = (perMonthRate: number) => {
    const term = paymentTerms.find((t) => String(t.Misc_Code) === String(paymentTerm));
    const months = term ? (parseInt(term.Misc_Abbr) || 1) : 1;

    const editedRate = parseFloat(actPerEmpRate);
    const mult = Number(activeMult) || 0;
    const effectiveMonthly = (!isNaN(editedRate) && mult > 0) ? editedRate * mult : perMonthRate;

    const amount = effectiveMonthly * months;

    const hasCustom = customDiscount !== "" && !isNaN(parseFloat(customDiscount));
    const discPct = hasCustom
      ? parseFloat(customDiscount)
      : (term && term.Misc_HOD != null && String(term.Misc_HOD).trim() !== "" ? parseFloat(term.Misc_HOD) : 0);

    // discount SIRF monthly amount pe
    const discountAmt = amount * discPct / 100;

    // one-time setup total (discount iss pe nahi lagta)
    const oneTimeSetupNum = Number(oneTimeSetup) || 0;
    const oneTimeDiscountNum = Number(oneTimeDiscount) || 0;
    const oneTimeTotalNum = oneTimeSetupNum - oneTimeDiscountNum;

    // taxable = (amount - discount) + one-time total
    const taxable = (amount - discountAmt) + oneTimeTotalNum;
    const gst = taxable * GST_RATE / 100;
    const grandTotal = taxable + gst;

    return { term, termName: term?.Misc_Name || "", months, amount, discPct, discountAmt, oneTimeSetupNum, oneTimeDiscountNum, oneTimeTotalNum, taxable, gst, grandTotal, effectiveMonthly };
  };
  useEffect(() => { fetchList(); fetchEmpRanges(); fetchPaymentTerms(); }, []);

  // Auto-fill from navigation search parameters (e.g. from Meta Lead Dashboard)
  useEffect(() => {
    const action = searchParams.get("action");
    const stakeholder = searchParams.get("stakeholder");
    const company = searchParams.get("company");
    const mobile = searchParams.get("mobile");
    const email = searchParams.get("email");
    const headquarters = searchParams.get("headquarters");
    const designation = searchParams.get("designation");
    const industry = searchParams.get("industry");
    const quotationType = searchParams.get("quotationType");
    const employees = searchParams.get("employees");
    const legacy = searchParams.get("legacy");

    if (action === "new" || stakeholder || company || mobile || email) {
      setEditUTD(null);
      setForm((prev: any) => ({
        ...EMPTY_FORM,
        Company: company || prev.Company || "",
        Stakeholder: stakeholder || prev.Stakeholder || "",
        Mobile: (mobile || prev.Mobile || "").replace(/[^0-9]/g, "").slice(0, 10),
        Email: email || prev.Email || "",
        Headquarters: headquarters || prev.Headquarters || "",
        Designation: designation || prev.Designation || "",
        Industry: industry || prev.Industry || "",
        QuotationType: quotationType ? Number(quotationType) : 1,
        Employees: employees || prev.Employees || "",
        Legacy: legacy || prev.Legacy || "",
      }));
      setErrors({});
      setView("form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);

  /* ---------------- GET LIST ---------------- */
  const fetchList = async () => {
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/clientIntakeList`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      if (res.data?.Status) {
        setClients((res.data.Data || []).map(fromApi));
      } else {
        showSideAlert(res.data?.Message || "Failed to load list", "error");
      }
    } catch (e) {
      console.error(e);
      showSideAlert("Error loading clients", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- GET SIGNATORY ---------------- */
  /* ---------------- GET SIGNATORY ---------------- */
  const fetchSignatory = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/interview/getSignatory`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      // Your API returns { data: result } directly
      if (res.data?.data) {
        // If data is an array, use it directly, otherwise wrap it
        const data = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        // Get the first active signatory (UTD = 1) or the first one
        const active = data.find((s: any) => s.UTD === 1);
        setSignatory(active || (data.length > 0 ? data[0] : null));
      } else {
        console.log("No signatory data found");
      }
    } catch (error) {
      console.error("Error fetching signatory:", error);
    }
  };
  useEffect(() => {
    fetchSignatory();
    fetchModules();
  }, []);

  // useEffect(() => {
  //   if (clientUTD) fetchModules();
  // }, [clientUTD]);
  const handlePrint = () => {
    // If in preview mode, use preview print
    if (view === "preview" && previewData) {
      handlePrintPreview();
      return;
    }

    const printHTML = generatePrintHTML();
    if (!printHTML) {
      showSideAlert("No client available to print proposal", "error");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      showSideAlert("Please allow popups to print", "error");
      return;
    }

    printWindow.document.write(printHTML);
    printWindow.document.close();
  };



  /* ---------------- GET employee ranges (Misc 674) ---------------- */
  const fetchEmpRanges = async () => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/HRSetuEmpRange`, {}, reqHeaders);
      if (res.data?.Status) setEmpRanges(res.data.Data || []);
    } catch (e) { console.error(e); }
  };

  /* ---------------- form handlers ---------------- */
  const handleChange = (name: string, value: any) => {
    let v = value;
    if (name === "Mobile") v = String(value).replace(/[^0-9]/g, "").slice(0, 10);
    if (name === "Legacy") v = String(value).slice(0, LEGACY_MAX);
    if (name === "GstNo") {
      v = String(value).toUpperCase();
    }
    if (name === "QuotationType") v = Number(value);
    setForm((p: any) => ({ ...p, [name]: v }));
    if (errors[name]) setErrors((p: any) => ({ ...p, [name]: "" }));
  };
  // Auto-update range when employee count changes
  const handleEmployeeCountChange = (value: string) => {
    setEmployeeWiseCost({
      ...employeeWiseCost,
      exactEmployeeCount: value
    });

    // Auto-update the range based on employee count
    if (value && parseFloat(value) > 0) {
      const count = parseFloat(value);
      const sortedRanges = [...empRanges].sort((a, b) => a.Misc_Code - b.Misc_Code);

      for (let i = 0; i < sortedRanges.length; i++) {
        const range = sortedRanges[i];
        const rangeValue = parseInt(range.Misc_Name.replace(/[^0-9]/g, ''));
        if (count <= rangeValue) {
          const rangeCode = String(range.Misc_Code);
          setForm((prev: any) => ({ ...prev, Employees: rangeCode }));
          setClientEmployees(rangeCode);
          break;
        }
      }
    }
  };
  const resetForm = () => { setForm({ ...EMPTY_FORM }); setErrors({}); };

  const resetQuotationState = () => {
    setPaymentTerm(paymentTerms.length ? String(paymentTerms[0].Misc_Code) : "");
    setCustomDiscount("");
    setOneTimeSetup("5000");
    setOneTimeDiscount("5000");
    setActPerEmpRate("");
    setRateSaved(false);
    setUserTouchedRate(false);
    setQuotPrefix("");
    setQuotNo(null);
    setPreviewData(null);
  };

  // const openAdd = () => { setEditUTD(null); resetForm(); resetQuotationState(); setView("form"); window.scrollTo({ top: 0 }); };
  const openAdd = () => {
    setEditUTD(null);
    resetForm();
    setPaymentTerm(paymentTerms.length ? String(paymentTerms[0].Misc_Code) : "");
    setCustomDiscount("");
    setOneTimeSetup("5000");
    setOneTimeDiscount("5000");
    setActPerEmpRate("");
    setRateSaved(false);
    setUserTouchedRate(false);
    setQuotPrefix("");
    setQuotNo(null);
    setPreviewData(null);
    setView("form");
    window.scrollTo({ top: 0 });
  };
  const openEdit = (c: any) => { setEditUTD(c.UTD); setForm({ ...EMPTY_FORM, ...c }); setErrors({}); setView("form"); window.scrollTo({ top: 0 }); };
  // const backToList = () => { setView("list"); setEditUTD(null); resetForm(); resetQuotationState(); window.scrollTo({ top: 0 }); };

  const backToList = () => {
    setView("list");
    setEditUTD(null);
    resetForm();
    setPaymentTerm(paymentTerms.length ? String(paymentTerms[0].Misc_Code) : "");
    setCustomDiscount("");
    setOneTimeSetup("5000");
    setOneTimeDiscount("5000");
    setActPerEmpRate("");
    setRateSaved(false);
    setUserTouchedRate(false);
    setQuotPrefix("");
    setQuotNo(null);
    setPreviewData(null);
    window.scrollTo({ top: 0 });
  };
  /* ---------------- DELETE ---------------- */
  const deleteClient = (c: any) => {
    Swal.fire({ title: "Delete client?", text: c?.Company, icon: "warning", showCancelButton: true, confirmButtonText: "Delete" })
      .then(async (r) => {
        if (!r.isConfirmed) return;
        try {
          setIsLoading(true);
          const res = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/clientIntakeDelete`, { UTD: c.UTD }, reqHeaders);
          if (res.data?.Status) { showSideAlert("Client removed", "success"); fetchList(); }
          else showSideAlert(res.data?.Message || "Delete failed", "error");
        } catch (e) { console.error(e); showSideAlert("Error removing client", "error"); }
        finally { setIsLoading(false); }
      });
  };

  /* ---------------- validation ---------------- */
  const validate = () => {
    const e: any = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.Company.trim()) e.Company = "Company name is required.";
    if (form.QuotationType === 2) {
      if (!form.DemoCarCount || Number(form.DemoCarCount) <= 0) e.DemoCarCount = "Please enter number of demo cars.";
    } else {
      if (!form.Employees) e.Employees = "Please select an employee count.";
    }
    if (!form.Stakeholder.trim()) e.Stakeholder = "Stakeholder name is required.";
    if (!form.Email.trim()) e.Email = "Email is required.";
    else if (!emailRe.test(form.Email.trim())) e.Email = "Enter a valid email address.";
    if (!form.Mobile.trim()) e.Mobile = "Mobile number is required.";
    else if (!/^\d{10}$/.test(form.Mobile.trim())) e.Mobile = "Enter a valid 10-digit mobile number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- load modules + prices for step-2 ---------------- */
  const loadModuleData = async (employees: string) => {
    let modsData: any[] = [];
    try {
      setIsLoading(true);
      const [mRes, pRes] = await Promise.all([
        axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/HRSetuModuleList`, {}, reqHeaders),
        axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/HRSetuModulePrice`, {}, reqHeaders), // all ranges
      ]);
      if (mRes.data?.Status) {
        modsData = mRes.data.Data || [];
        setModules(modsData);
      }
      if (pRes.data?.Status) {
        const nested: Record<string, Record<string, number>> = {};
        const flat: Record<string, number> = {};
        (pRes.data.Data || []).forEach((row: any) => {
          const rc = String(row.EMP_RANGE_CODE);
          if (!nested[rc]) nested[rc] = {};
          nested[rc][String(row.TAG)] = Number(row.PRICE);
          if (rc === String(employees)) flat[String(row.TAG)] = Number(row.PRICE);
        });
        setPriceByRange(nested);
        setPriceByTag(flat);
      }
    } catch (e) { console.error(e); showSideAlert("Error loading modules", "error"); }
    finally { setIsLoading(false); }
    return modsData;
  };

  /* ---------------- GET existing step-2 (prefill on edit/continue) ---------------- */
  const fetchQuotationModules = async (linkUTD: any) => {
    if (!linkUTD) {
      setStep2Exists(false);
      return false;
    }

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getQuotationModules`,
        { LINK_UTD: linkUTD },
        reqHeaders
      );

      if (res.data?.Status) {
        const d = res.data.Data || {};
        const keys: string[] = d.KEYS || [];

        if (keys.length > 0 || d.PLAN_CODE) {
          setPlan(Number(d.PLAN_CODE) || 0);
          setSelectedTags(new Set(keys.map(String)));
          setStep2Exists(true);

          // ✅ Payment Term restore
          if (d.PAYMENT_TERMS_CODE) {
            setPaymentTerm(String(d.PAYMENT_TERMS_CODE));
          }
          if (d.ACT_PER_EMP_RATE != null) {
            setActPerEmpRate(String(d.ACT_PER_EMP_RATE));
            setRateSaved(true);   // pichle jawaab wala flag — isse fresh calculation overwrite nahi karega
          }

          if (d.CUSTOM_DISCOUNT_PER != null) {
            setCustomDiscount(String(d.CUSTOM_DISCOUNT_PER));
          }

          // ✅ Employee Wise Cost restore
          if (d.IS_EMPLOYEE_WISE) {
            setEmployeeWiseCost({
              isEmployeeWise: d.IS_EMPLOYEE_WISE,
              exactEmployeeCount: d.EXACT_EMPLOYEE_COUNT || "",
            });
          }

          // ✅ Employee Range restore
          if (d.EMPLOYEE_COUNT) {
            console.log("EMPLOYEE_COUNT:", d.EMPLOYEE_COUNT);

            setForm((prev: any) => ({
              ...prev,
              Employees: String(d.EMPLOYEE_COUNT),
            }));

            setClientEmployees(String(d.EMPLOYEE_COUNT));
          }
          if (d.OPTIONAL_TERMS) {
            const arr = String(d.OPTIONAL_TERMS).split(TERMS_DELIM);
            setOptionalTerms([
              arr[0] || "", arr[1] || "", arr[2] || "",
              arr[3] || "", arr[4] || "",
            ]);
          }

          return true;
        }
      }

      setStep2Exists(false);
      return false;
    } catch (e) {
      console.error(e);
      setStep2Exists(false);
      return false;
    }
  };
  const getQuotationTerms = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getQuotationTerms`,
        {},
        reqHeaders
      );
      if (res.data?.Status) {
        setMasterTerms(res.data.Data || []);
      }
    } catch (e) {
      console.error("Error fetching terms:", e);
    }
  };
  useEffect(() => {
    getQuotationTerms();
  }, []);
  useEffect(() => {
    if (masterTerms.length > 0 && selectedTerms.length === 0) {
      setSelectedTerms(masterTerms.map((t: any) => t.code));
    }
  }, [masterTerms]);
  const handleTerm = (code: string) => {
    setSelectedTerms((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  };
  const handleOptionalTerm = (idx: number, value: string) => {
    const v = value.slice(0, 500);
    setOptionalTerms((prev) => {
      const n = [...prev];
      n[idx] = v;
      return n;
    });
  };

  /* ---------------- SAVE / UPDATE & NEXT  (-> go to step 2) ---------------- */
  const handleSaveNext = async () => {
    if (!validate()) { showSideAlert("Please fix the highlighted fields", "error"); return; }
    try {
      setIsLoading(true);
      const endpoint = isEdit ? "clientIntakeUpdate" : "clientIntakeSave";
      const res = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/${endpoint}`,
        toApi(form, isEdit ? editUTD : undefined), reqHeaders);

      if (res.data?.Status) {
        showSideAlert(isEdit ? "Client updated" : "Client saved", "success");
        await fetchList();
        // resolve client UTD (edit known; new -> use API UTD if returned)
        const savedUTD = isEdit ? editUTD : (res.data?.UTD ?? res.data?.Data?.UTD ?? null);
        setClientUTD(savedUTD);
        // naya client tha to ab isse "edit" bana do taaki dobara Save pe UPDATE ho (duplicate na bane)
        if (!isEdit && savedUTD) {
          setEditUTD(savedUTD);
        }
        // setClientEmployees(form.Employees);
        // // reset step-2 selections
        // setPlan(0); setSelectedTags(new Set()); setStep2Exists(false);
        // resetQuotationState();
        // setEmployeeWiseCost({ isEmployeeWise: "No", exactEmployeeCount: "" });
        // setSelectedTerms(masterTerms.map((t: any) => t.code));
        // setOptionalTerms(["", "", "", "", ""]);
        // await loadModuleData(form.Employees);
        // await fetchQuotationModules(savedUTD);   // prefill if step-2 already saved
        setClientEmployees(form.Employees);
        // reset step-2 selections
        setPlan(0); setSelectedTags(new Set()); setStep2Exists(false);
        setEmployeeWiseCost({ isEmployeeWise: "No", exactEmployeeCount: "" });
        setSelectedTerms(masterTerms.map((t: any) => t.code));
        setOptionalTerms(["", "", "", "", ""]);
        // 👇 IMPORTANT: purane client ka payment/rate/discount data yahan clear karo
        // taaki naye client mein carry na ho. Agar is client ka apna saved data hai,
        // to niche wala fetchQuotationModules() usse turant wapas restore kar dega.
        setPaymentTerm(paymentTerms.length ? String(paymentTerms[0].Misc_Code) : "");
        setCustomDiscount("");
        setOneTimeSetup("5000");
        setOneTimeDiscount("5000");
        setActPerEmpRate("");
        setRateSaved(false);
        setUserTouchedRate(false);
        setQuotPrefix("");
        setQuotNo(null);
        setPreviewData(null);
        const modsData = await loadModuleData(form.Employees);
        const hadExistingStep2 = await fetchQuotationModules(savedUTD);

        // For a brand-new Demo Car quotation with no prior saved modules,
        // auto-select ALL demo car modules by default (Demo Car has no plan
        // choice, so everything should come pre-ticked, same spirit as
        // Standard Plan auto-selecting standardTags for Payroll).
        if (form.QuotationType === 2 && !hadExistingStep2) {
          const demoModules = (modsData || []).filter(
            (m: any) => Number(m.MODULE_TYPE) === 2
          );
          const isHeaderFn = (m: any) => m.IS_HEADER === 1 || m.IS_HEADER === true;
          const demoSelectable = [
            ...demoModules.filter((m: any) => !isHeaderFn(m)),
            ...demoModules.filter(
              (m: any) => isHeaderFn(m) &&
                !demoModules.some((c: any) => c.PARENT_TAG === m.TAG)
            ),
          ];
          setSelectedTags(new Set(demoSelectable.map((m: any) => String(m.TAG))));
          setPlan(1);
        }
        setView("modules");
        window.scrollTo({ top: 0 });
      } else {
        showSideAlert(res.data?.Message || "Save failed", "error");
      }
    } catch (e) { console.error(e); showSideAlert("Something went wrong while saving", "error"); }
    finally { setIsLoading(false); }
  };

  /* ---------------- STEP-2 derived ---------------- */
  const isHeader = (m: any) => m.IS_HEADER === 1 || m.IS_HEADER === true;
  const isStd = (m: any) => m.IN_STANDARD === 1 || m.IN_STANDARD === true;
  const isAttendance = (m: any) => m.IN_ATTENDANCE === 1 || m.IN_ATTENDANCE === true;   // 👈 NE
  const typeFilteredModules = modules.filter((m) => Number(m.MODULE_TYPE) === (isDemoCar ? 2 : 1));
  const childrenOf = (tag: any) => typeFilteredModules.filter((m) => !isHeader(m) && m.PARENT_TAG === tag);

  const sections = typeFilteredModules.filter(isHeader).map((h) => {
    const children = childrenOf(h.TAG);
    return { header: h, children, standalone: children.length === 0 }; // header with no children = selectable itself
  });

  // selectable items = all child features + headers that have NO children
  const selectableItems = [
    ...typeFilteredModules.filter((m) => !isHeader(m)),
    ...typeFilteredModules.filter((m) => isHeader(m) && childrenOf(m.TAG).length === 0),
  ];
  const allChildTags = Array.from(new Set(selectableItems.map((m) => String(m.TAG))));
  const standardTags = Array.from(new Set(selectableItems.filter(isStd).map((m) => String(m.TAG))));
  const attendanceTags = Array.from(new Set(selectableItems.filter(isAttendance).map((m) => String(m.TAG)))); // 👈 NEW
  // Check if checkbox should be disabled
  // const isCheckboxDisabled = plan === 1 || plan === 4; // Standard Plan (1) or Full Package (4)

  // Replace the existing handlePlanChange with this:
  const handlePlanChange = (_n: string, value: any) => {
    const code = Number(value) || 0;
    setPlan(code);
    if (code === 1) setSelectedTags(new Set(standardTags));   // Standard
    else if (code === 2) setSelectedTags(new Set(allChildTags)); // Growth = all
    else if (code === 4) setSelectedTags(new Set(attendanceTags));
    else setSelectedTags(new Set());                           // Enterprise = free
  };
  useEffect(() => {
    if (isDemoCar && view === "modules" && plan !== 1) {
      setPlan(1);
    }
  }, [isDemoCar, view]);

  // Add this function after your state declarations (around line 250)
  const calculateEmployeeWiseTotal = (exactCount: string, selectedTags: Set<string>, priceByTag: Record<string, number>, empRanges: any[]) => {
    if (!exactCount || parseFloat(exactCount) <= 0) return 0;

    const count = parseFloat(exactCount);

    // Sort ranges by Misc_Code
    const sortedRanges = [...empRanges].sort((a, b) => a.Misc_Code - b.Misc_Code);

    // Find which range the count falls into
    let targetRange = null;
    let previousRange = null;
    let targetIndex = -1;

    for (let i = 0; i < sortedRanges.length; i++) {
      const range = sortedRanges[i];
      // Extract the number from Misc_Name (e.g., "< 25" -> 25)
      const rangeValue = parseInt(range.Misc_Name.replace(/[^0-9]/g, ''));

      if (count <= rangeValue) {
        targetRange = range;
        targetIndex = i;
        // Get previous range (if exists)
        if (i > 0) {
          previousRange = sortedRanges[i - 1];
        }
        break;
      }
    }



    // If count is greater than all ranges, use the last range
    if (!targetRange && sortedRanges.length > 0) {
      targetRange = sortedRanges[sortedRanges.length - 1];
      targetIndex = sortedRanges.length - 1;
      previousRange = sortedRanges[sortedRanges.length - 2] || sortedRanges[sortedRanges.length - 1];
    }

    // If no previous range exists, use the target range itself
    const priceRange = previousRange || targetRange;

    if (!priceRange) return 0;

    // Get the price from Misc_HOD
    const rangePrice = parseFloat(priceRange.Misc_HOD) || 0;

    // Employee-wise total = employee count × range price
    return count * rangePrice;
  };
  // Growth (2) -> everything disabled; Standard (1) -> standard tags locked-on (not visually disabled)
  const isAllDisabled = !isDemoCar && plan === 2;
  const tagLocked = (tag: any) => !isDemoCar && plan === 1 && standardTags.includes(String(tag));

  const toggleTag = (tag: string) => {
    if (isAllDisabled) return;
    if (tagLocked(tag)) { showSideAlert("Standard modules are included and can't be removed", "warning"); return; }
    setSelectedTags((prev) => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });
  };

  const sectionState = (children: any[]) => {
    const tags = Array.from(new Set(children.map((c) => String(c.TAG))));
    const on = tags.filter((t) => selectedTags.has(t)).length;
    return on === 0 ? "none" : on === tags.length ? "all" : "some";
  };

  const toggleSection = (children: any[]) => {
    if (isAllDisabled) return;
    const toggleable = Array.from(new Set(children.map((c) => String(c.TAG)))).filter((t) => !tagLocked(t));
    if (toggleable.length === 0) { showSideAlert("Standard modules are included and can't be removed", "warning"); return; }
    const allOn = toggleable.every((t) => selectedTags.has(t));
    setSelectedTags((prev) => { const n = new Set(prev); allOn ? toggleable.forEach((t) => n.delete(t)) : toggleable.forEach((t) => n.add(t)); return n; });
  };
  /* ---- pricing: module-price sum vs plan min (Misc_HOD) ---- */
  const sortedRanges = [...empRanges].sort((a, b) => a.Misc_Code - b.Misc_Code);
  const rangeMax = (r: any) => parseInt(String(r?.Misc_Name || "").replace(/[^0-9]/g, "")) || 0;
  const rangeMin = (r: any) => parseFloat(r?.Misc_HOD) || 0;
  const sumSelected = (rangeCode: any) => {
    const m = priceByRange[String(rangeCode)] || {};
    return Array.from(selectedTags).reduce((s, t) => s + (Number(m[t]) || 0), 0);
  };
  const sumSelectedDemo = () => Array.from(selectedTags).reduce((s, t) => s + (Number((priceByRange[DEMO_CAR_RANGE_CODE] || {})[t]) || 0), 0);
  const findEmpWiseRange = (count: number) => {
    let target: any = null, prev: any = null;
    for (let i = 0; i < sortedRanges.length; i++) {
      if (count <= rangeMax(sortedRanges[i])) { target = sortedRanges[i]; if (i > 0) prev = sortedRanges[i - 1]; break; }
    }
    if (!target && sortedRanges.length) { target = sortedRanges[sortedRanges.length - 1]; prev = sortedRanges[sortedRanges.length - 2] || target; }
    return prev || target; // e.g. 55 -> "<50"
  };
  const computeTotal = () => {
    if (isDemoCar) {
      const count = parseFloat(form.DemoCarCount) || 0;
      if (count <= 0) return 0;
      return count * sumSelectedDemo();
    }
    if (employeeWiseCost.isEmployeeWise === "Yes") {
      const count = parseFloat(employeeWiseCost.exactEmployeeCount);
      if (!count || count <= 0) return 0;
      const pr = findEmpWiseRange(count);
      if (!pr) return 0;
      const minV = rangeMin(pr), selP = sumSelected(pr.Misc_Code);
      return count * (selP >= minV ? selP : minV);
    }
    const r = empRanges.find((x) => String(x.Misc_Code) === String(form.Employees));
    if (!r) return 0;
    const minV = rangeMin(r), selP = sumSelected(r.Misc_Code);
    return rangeMax(r) * (selP >= minV ? selP : minV);
  };
  const total = computeTotal();
  const activeRange = employeeWiseCost.isEmployeeWise === "Yes"
    ? findEmpWiseRange(parseFloat(employeeWiseCost.exactEmployeeCount))
    : empRanges.find((x) => String(x.Misc_Code) === String(form.Employees));
  const activeMult = isDemoCar
    ? (Number(form.DemoCarCount) || 0)
    : employeeWiseCost.isEmployeeWise === "Yes"
      ? (parseFloat(employeeWiseCost.exactEmployeeCount) || 0)
      : (activeRange ? rangeMax(activeRange) : 0);
  const activePerEmp = isDemoCar
    ? sumSelectedDemo()
    : activeRange
      ? Math.round(Math.max(sumSelected(activeRange.Misc_Code), rangeMin(activeRange)) * 100) / 100
      : 0;
  // Add this line back
  const selectedCount = selectableItems.filter((m) => selectedTags.has(String(m.TAG))).length;

  const handleStep2Save = async () => {
    if (!clientUTD) { showSideAlert("Client id missing, please save Step 1 first", "error"); return; }
    if (!plan) { showSideAlert("Please select a plan", "error"); return; }
    if (selectedTags.size === 0) { showSideAlert("Please select at least one module", "error"); return; }

    // Validate employee wise cost
    if (employeeWiseCost.isEmployeeWise === "Yes" && !employeeWiseCost.exactEmployeeCount) {
      showSideAlert("Please enter the exact number of employees", "error");
      return;
    }
    if (employeeWiseCost.isEmployeeWise === "Yes" && parseFloat(employeeWiseCost.exactEmployeeCount) <= 0) {
      showSideAlert("Please enter a valid employee count", "error");
      return;
    }

    try {
      setIsLoading(true);

      // Calculate total based on employee wise selection
      const finalTotal = computeTotal();   // UI ka same total (greater of sum vs min) × count/maxCount
      let newEmployeeRange = form.Employees;
      if (!isDemoCar && employeeWiseCost.isEmployeeWise === "Yes") {
        const pr = findEmpWiseRange(parseFloat(employeeWiseCost.exactEmployeeCount));
        if (pr) {
          newEmployeeRange = String(pr.Misc_Code);
          setForm((prev: any) => ({ ...prev, Employees: newEmployeeRange }));
          setClientEmployees(newEmployeeRange);
        }
      }

      const endpoint = step2Exists ? "updateQuotationModules" : "saveQuotationModules";
      const payload = {
        LINK_UTD: clientUTD,
        PLAN_CODE: isDemoCar ? 1 : plan,
        TOTAL_AMOUNT: finalTotal,
        KEYS: Array.from(selectedTags),
        IS_EMPLOYEE_WISE: isDemoCar ? "No" : employeeWiseCost.isEmployeeWise,
        EXACT_EMPLOYEE_COUNT: isDemoCar ? null : (employeeWiseCost.isEmployeeWise === "Yes" ? parseInt(employeeWiseCost.exactEmployeeCount) : null),
        EMPLOYEE_RANGE_CODE: isDemoCar ? form.Employees : newEmployeeRange,
        PER_EMP_RATE: activePerEmp,
        EMP_MULTIPLIER: activeMult,
        QUOTATION_TYPE: form.QuotationType,
        DEMO_CAR_COUNT: isDemoCar ? Number(form.DemoCarCount) : null,
      };

      const res = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/${endpoint}`, payload, reqHeaders);

      if (res.data?.Status) {
        setStep2Exists(true);

        // Prepare preview data
        // if (!actPerEmpRate) setActPerEmpRate(String(activePerEmp || ""));
        if (!rateSaved) {
          setActPerEmpRate(String(activePerEmp || ""));
        }
        setPreviewData({
          client: form,
          plan: plan,
          planLabel: planLabel,
          selectedModules: selectedTags,
          modules: modules,
          total: finalTotal,
          employeeWiseCost: employeeWiseCost,
          selectedCount: selectedCount,
          empRangeName: empRangeMap[form.Employees] || form.Employees
        });

        // Go to preview
        setView("preview");
        window.scrollTo({ top: 0 });

        showSideAlert("Quotation saved successfully!", "success");
      } else {
        showSideAlert(res.data?.Message || "Save failed", "error");
      }
    } catch (e) {
      console.error(e);
      showSideAlert("Something went wrong while saving modules", "error");
    }
    finally { setIsLoading(false); }
  };
  // Preview render function
  // ADD THIS NEW HELPER FUNCTION FIRST (before renderPreview)
  const renderModuleHierarchy = (modules: any[], selectedTags: Set<string>) => {
    // Get all main module headers (where PARENT_TAG is NULL or empty)
    const mainModules = modules.filter((m: any) => !m.PARENT_TAG && m.IS_HEADER);

    if (mainModules.length === 0) {
      return <div className="text-sm text-gray-400">No modules selected</div>;
    }

    return (
      <div className="space-y-3">
        {mainModules
          .sort((a: any, b: any) => parseInt(a.TAG) - parseInt(b.TAG))
          .map((mainHeader: any) => {
            // Get child modules for this main module
            const childModules = modules.filter((m: any) => m.PARENT_TAG === mainHeader.TAG);
            // const subModules = childModules.filter((m: any) => m.IS_HEADER !== true);
            // const selectedSubModules = subModules.filter((m: any) =>
            //   selectedTags.has(String(m.TAG))
            // );

            // if (selectedSubModules.length === 0) return null;
            const headerSelected = selectedTags.has(String(mainHeader.TAG));

            const subModules = childModules.filter((m) => m.IS_HEADER !== true);

            const selectedSubModules = subModules.filter((m) =>
              selectedTags.has(String(m.TAG))
            );

            // agar header bhi select nahi aur koi child bhi select nahi
            if (!headerSelected && selectedSubModules.length === 0) return null;

            return (
              <div key={mainHeader.UTD} className="border-l-2 border-blue-400 pl-3">
                <div className="font-semibold text-sm text-[#1f2d4d] dark:text-gray-200">
                  {mainHeader.MODULE_NAME}
                </div>
                <div className="ml-4 mt-1 space-y-0.5">
                  {selectedSubModules.map((child: any) => (
                    <div key={child.UTD} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>{child.MODULE_NAME}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    );
  };
  useEffect(() => {
    if (!rateSaved && !userTouchedRate) {
      setActPerEmpRate(activePerEmp ? String(Math.round(activePerEmp * 100) / 100) : "");
    }
  }, [activePerEmp]);

  // THEN REPLACE THE ENTIRE renderPreview WITH THIS:
  const renderPreview = () => {
    if (!previewData) return null;

    const { client, planLabel, selectedModules, modules, total, employeeWiseCost, selectedCount, empRangeName } = previewData;
    const isDemoCar = client?.QuotationType === 2;
    // terms list for preview (master selected + optional non-empty)
    const previewTermsList = [
      ...masterTerms.filter((t: any) => selectedTerms.includes(t.code)).map((t: any) => t.text),
      ...optionalTerms.filter((x) => x && x.trim() !== ""),
    ];

    return (
      <div className="rounded-b-xl bg-white dark:bg-black border-x border-b border-borderColor dark:border-borderColor-dark shadow-md" id="preview-container">
        <Stepper active={3} />
        <div className="px-4 md:px-6 pt-4">
          <h3 className="text-base md:text-lg font-extrabold text-[#1f2d4d] dark:text-[#37a9dd]">Quotation Preview</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Review all details before submitting</p>
        </div>

        <div id="preview-content" className="px-4 md:px-6">
          {/* Organization Details */}
          <div className="mb-6">
            <h4 className="font-bold text-sm text-[#1f2d4d] dark:text-gray-200 mb-3 border-b border-borderColor dark:border-borderColor-dark pb-2">Organization Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="text-gray-500 text-xs">Company:</span> <span className="font-medium">{client.Company}</span></div>
              <div><span className="text-gray-500 text-xs">Industry:</span> <span className="font-medium">{client.Industry}</span></div>
              {isDemoCar ? (
                <div><span className="text-gray-500 text-xs">Number of Demo Cars:</span> <span className="font-medium">{client.DemoCarCount}</span></div>
              ) : (
                <div><span className="text-gray-500 text-xs">Employee Count:</span> <span className="font-medium">{empRangeName}</span></div>
              )}
              <div><span className="text-gray-500 text-xs">Stakeholder:</span> <span className="font-medium">{client.Stakeholder}</span></div>
              <div><span className="text-gray-500 text-xs">Designation:</span> <span className="font-medium">{client.Designation}</span></div>
              <div><span className="text-gray-500 text-xs">Email:</span> <span className="font-medium">{client.Email}</span></div>
              <div><span className="text-gray-500 text-xs">Mobile:</span> <span className="font-medium">{client.Mobile}</span></div>
              <div><span className="text-gray-500 text-xs">Headquarters:</span> <span className="font-medium">{client.Headquarters}</span></div>
            </div>
          </div>

          {/* Plan & Modules - THIS IS THE CHANGED PART */}
          <div className="mb-6">
            <h4 className="font-bold text-sm text-[#1f2d4d] dark:text-gray-200 mb-3 border-b border-borderColor dark:border-borderColor-dark pb-2">Plan & Modules</h4>
            <div className="mb-2"><span className="text-gray-500 text-xs">Plan:</span> <span className="font-medium">{planLabel}</span></div>
            <div className="mb-2"><span className="text-gray-500 text-xs">Modules Selected:</span> <span className="font-medium">{selectedCount}</span></div>

            <div className="bg-[#fafbfe] dark:bg-[#111] p-4 rounded-lg">
              <div className="text-xs text-gray-500 mb-2">Selected Modules:</div>
              {renderModuleHierarchy(modules, selectedModules)}
            </div>
          </div>

          {/* Employee Wise Cost */}
          {!isDemoCar && employeeWiseCost.isEmployeeWise === "Yes" && (
            <div className="mb-6">
              <h4 className="font-bold text-sm text-[#1f2d4d] dark:text-gray-200 mb-3 border-b border-borderColor dark:border-borderColor-dark pb-2">Employee Wise Cost</h4>
              <div><span className="text-gray-500 text-xs">Exact Employee Count:</span> <span className="font-medium">{employeeWiseCost.exactEmployeeCount}</span></div>
            </div>
          )}

          {/* Total Amount */}
          {/* Payment Terms + Pricing Breakdown */}
          {(() => {
            const b = computeBreakdown(Number(total) || 0);
            return (
              <div className="mb-6">
                <h4 className="font-bold text-sm text-[#1f2d4d] dark:text-gray-200 mb-3 border-b border-borderColor dark:border-borderColor-dark pb-2">Payment Terms</h4>
                <div className="mb-3 max-w-xs">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Payment Terms</label>
                  <select className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white"
                    value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}>
                    {paymentTerms.map((t) => <option key={t.Misc_Code} value={t.Misc_Code}>{t.Misc_Name}</option>)}
                  </select>
                </div>
                {/* Per Employee / Month + Employee Count + Discount */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 max-w-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{isDemoCar ? "Per Demo Car / Month (₹)" : "Per Employee / Month (₹)"}</label>
                    <input
                      type="number" step="any"
                      className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white"
                      value={actPerEmpRate}
                      onChange={(e) => {
                        setActPerEmpRate(e.target.value);
                        setUserTouchedRate(true);
                      }}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value);
                        setActPerEmpRate(isNaN(v) ? "" : v.toFixed(2));
                      }}
                      placeholder="Per employee rate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{isDemoCar ? "Demo Car Count (×)" : "Employee Count (×)"}</label>
                    <input
                      type="number"
                      className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-gray-100 dark:bg-[#111] text-black dark:text-white"
                      value={activeMult || 0}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Discount % (optional)</label>
                    <input
                      type="number" step="any"
                      className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      placeholder="Auto if blank"
                    />
                  </div>
                </div>
                {/* One-Time Cost editable */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 max-w-2xl">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">One-Time Setup (₹)</label>
                    <input
                      type="number" step="any"
                      className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white"
                      value={oneTimeSetup}
                      onChange={(e) => setOneTimeSetup(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">One-Time Discount (₹)</label>
                    <input
                      type="number" step="any"
                      className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white"
                      value={oneTimeDiscount}
                      onChange={(e) => setOneTimeDiscount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Setup Total (₹)</label>
                    <input
                      type="number"
                      className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-gray-100 dark:bg-[#111] text-black dark:text-white"
                      value={((Number(oneTimeSetup) || 0) - (Number(oneTimeDiscount) || 0)).toFixed(2)}
                      disabled
                    />
                  </div>
                </div>
                <table className="w-full text-sm border border-borderColor dark:border-borderColor-dark">
                  <thead><tr className="bg-[#fafbfe] dark:bg-[#111] text-left">
                    <th className="px-3 py-2">{isDemoCar ? "Per Demo Car / Month" : "Per Employee / Month"}</th>
                    <th className="px-3 py-2">{isDemoCar ? "Demo Car Count" : "Employee Count"}</th>
                    <th className="px-3 py-2">Per Month Rate</th>
                    <th className="px-3 py-2">No. of Months</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr></thead>
                  <tbody><tr>
                    <td className="px-3 py-2">₹ {(Number(actPerEmpRate) || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">{Number(activeMult) || 0}</td>
                    <td className="px-3 py-2">₹ {Number(b.effectiveMonthly).toFixed(2)}</td>
                    <td className="px-3 py-2">{b.months}</td>
                    <td className="px-3 py-2 text-right">₹ {b.amount.toFixed(2)}</td>
                  </tr></tbody>
                </table>
                <div
                  className="
mt-3
space-y-1
text-sm
w-full
max-w-[320px]
ml-auto
pr-3
"
                >
                  {b.discPct > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Discount ({b.discPct}%)</span><span>- ₹ {b.discountAmt.toFixed(2)}</span></div>
                  )}
                  <div className="flex items-center justify-between gap-8"><span className="text-gray-500">One-Time Setup Total</span><span>+ ₹ {b.oneTimeTotalNum.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between gap-8"><span className="text-gray-500">Taxable</span><span>₹ {b.taxable.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between gap-8"><span className="text-gray-500">GST ({GST_RATE}%)</span><span>₹ {b.gst.toFixed(2)}</span></div>
                  <div className="
flex
items-center
justify-between
gap-8
font-bold
border-t
pt-2
">
                    <span>Total Amount</span><span>₹ {b.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        {previewTermsList.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-sm text-[#1f2d4d] dark:text-gray-200 mb-3 border-b border-borderColor dark:border-borderColor-dark pb-2">
              Terms &amp; Conditions
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {previewTermsList.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-between items-center border-t border-borderColor dark:border-borderColor-dark px-4 md:px-6 py-4 bg-[#fafbfe] dark:bg-[#0a0a0a] rounded-b-xl">
          <Button variant={"print"} onClick={() => { setView("modules"); window.scrollTo({ top: 0 }); }}>← Back to Edit</Button>
          <div className="flex gap-3">

            <Button variant={"save"} onClick={handleSubmitQuotation}>Submit & Send WhatsApp</Button>
          </div>
        </div>
      </div>
    );
  };
  // Handle Print Preview
  const handlePrintPreview = () => {
    const printContent = document.getElementById('preview-content');
    if (!printContent) {
      showSideAlert("Preview content not found", "error");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      showSideAlert("Please allow popups to print", "error");
      return;
    }

    // Get all styles from the page
    const styles = document.querySelectorAll('style');
    let styleHTML = '';
    styles.forEach(style => {
      styleHTML += style.outerHTML;
    });

    // Get all link tags (for external CSS)
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    let linkHTML = '';
    links.forEach(link => {
      linkHTML += link.outerHTML;
    });

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quotation Preview</title>
        ${linkHTML}
        ${styleHTML}
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: white;
          }
          #preview-content {
            max-width: 1100px;
            margin: 0 auto;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; margin-bottom: 5px; }
          .label { width: 150px; font-weight: bold; }
          .value { flex: 1; }
          .total { font-size: 24px; font-weight: bold; color: #1f2d4d; margin-top: 10px; }
          .module-group {
            border-left: 3px solid #3b82f6;
            padding-left: 12px;
            margin-bottom: 10px;
          }
          .module-header {
            font-weight: bold;
            color: #1f2d4d;
            margin-bottom: 4px;
          }
          .module-child {
            padding-left: 20px;
            color: #4b5563;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .module-child .bullet {
            color: #3b82f6;
          }
        </style>
      </head>
      <body>
        <div id="print-content">
          <h1 style="text-align: center; color: #1f2d4d; margin-bottom: 10px;">Quotation Preview</h1>
          <p style="text-align: center; color: #6b7280; margin-bottom: 20px;">
            Generated on: ${new Date().toLocaleString()}
          </p>
          ${printContent.innerHTML}
        </div>
        <script>
          setTimeout(function() {
            window.print();
          }, 500);
        <\/script>
      </body>
    </html>
  `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const generatePrintHTML = (refPrefix?: string, refNoNum?: number | null) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');

    // Generate Ref No
    const refNo = (refPrefix && refNoNum != null)
      ? `${refPrefix}-${refNoNum}`
      : (quotPrefix && quotNo != null)
        ? `${quotPrefix}-${quotNo}`
        : `VYNHR-2026-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Get selected client (first one in list or allow selection)
    // const selectedClient = filtered.length > 0 ? filtered[0] : null;
    const selectedClient = clients.find(x => x.UTD == clientUTD);

    if (!selectedClient) return "";

    const b = computeBreakdown(Number(total) || 0);
    // dynamic terms (master selected + optional)
    const selectedTexts = masterTerms
      .filter((t: any) => selectedTerms.includes(t.code))
      .map((t: any) => t.text);
    const optTexts = optionalTerms.filter((x) => x && x.trim() !== "");
    const termsList = [...selectedTexts, ...optTexts];
    const termsHTML = termsList.length
      ? termsList.map((x) => `<li>${x}</li>`).join("")
      : `<li>—</li>`;

    const oneTimeSetupNum = Number(oneTimeSetup) || 0;
    const oneTimeDiscountNum = Number(oneTimeDiscount) || 0;
    const oneTimeTotalNum = oneTimeSetupNum - oneTimeDiscountNum;

    // Valid-till = aaj se 8 din aage
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + 8);
    const validTillStr = validTill.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    // Logo path
    const logoPath = 'https://erp.autovyn.com/logo.png';

    // Get signatory data from state
    const signatoryImage = signatory?.File_Path || '';
    const signatoryName = signatory?.Sign_Name || 'Authorized Signatory';
    const signatoryDesignation = signatory?.Sign_Desig || '';

    // Build signature HTML
    const signatureHTML = signatoryImage
      ? `
      <img
        src="https://erp.autovyn.com/backend/fetch?filePath=${signatoryImage}"
        alt="signature"
        style="
          height:50px;
          width:auto;
          display:block;
          margin-top:4px;
          margin-bottom:2px;
        "
      />
    `
      : "";

    const printIsDemoCar = previewData?.client?.QuotationType === 2;
    const printTypeFilteredModules = modules.filter((m: any) => Number(m.MODULE_TYPE) === (printIsDemoCar ? 2 : 1));
    const moduleWiseCoverageHTML = generateModuleHTML(
      printTypeFilteredModules,
      previewData.selectedModules,
      printIsDemoCar
    );
    const subjectLine = printIsDemoCar
      ? "Sub: Proposal for Demo Car Program."
      : "Sub: Software Proposal for implementation of Integrated HRMS and Payroll System.";
    const perUnitLabel = printIsDemoCar ? "Per Demo Car / Month" : "Per Employee / Month";
    const unitCountLabel = printIsDemoCar ? "Demo Car Count" : "Employee Count";

    return `
  <!DOCTYPE html>
  <html>
    <head>
      <title>HRMS Payroll Proposal - ${selectedClient.Company}</title>
      <style>
      @page {
          margin: 8mm 12mm;
        }
        /* RESET */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
       
        body {
          font-family: Arial, Helvetica, sans-serif;
          padding: 0 20px;
          background: white;
          color: #1f2937;
        }
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 15px;
        }

        /* HEADER - Three column layout with nowrap */
       .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
  padding: 0;
  width: 100%;
  gap: 15px;
}
       
        /* LEFT COLUMN - Red Block */
        .header-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #DC2626;
          padding: 8px 20px;
          border-radius: 4px;
          min-width: 160px;
          flex-shrink: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .header-left .brand-name {
          font-size: 22px !important;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: 1px;
          line-height: 1.1;
          white-space: nowrap;
        }
        .header-left .brand-sub {
          font-size: 12px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: 1px;
          margin-top: 1px;
          white-space: nowrap;
        }
       
        /* CENTER COLUMN - Logo - CENTERED */
        .header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 120px;
  text-align: center;
}
       .header-center .logo-img {
  width: 90px !important;
  height: 80px !important;
  object-fit: contain;
  margin: 0 auto;
  display: block;
}
        .header-center .colored-brand {
  font-size: 14px !important;
  font-weight: 900;
  letter-spacing: 0px !important;
  margin-top: 2px;
  display: inline-block;
  white-space: nowrap !important;
  text-align: center;
}
        .header-center .colored-brand span {
          display: inline;
        }
        .header-center .colored-brand .red-char {
          color: #DC2626;
        }
        .header-center .colored-brand .yellow-char {
          color: #EAB308;
        }
        .header-center .colored-brand .blue-char {
          color: #3bd4f6;
        }
        .header-center .colored-brand .black-char {
          color: #000000;
        }
       
        /* RIGHT COLUMN - Company Details */
        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          min-width: 180px;
          flex-shrink: 0;
        }
        .header-right .company-name {
          font-size: 20px;
          font-weight: 700;
          color: #000000;
          line-height: 1.2;
          white-space: nowrap;
        }
        .header-right .tagline {
          font-size: 13px;
          font-weight: 600;
          margin-top: 1px;
          letter-spacing: 0px;
          white-space: nowrap;
        }
        .header-right .tagline .red-text {
          color: #DC2626;
        }
        .header-right .tagline .yellow-text {
          color: #EAB308;
        }
        .header-right .tagline .blue-text {
          color: #3bd4f6;
        }
        .header-right .website {
          font-size: 11px;
          color: #000000;
          font-weight: 600;
          margin-top: 1px;
          white-space: nowrap;
        }
       
        .header-divider {
          border: none;
          border-top: 2px solid #193A69;
          margin: 8px 0 12px 0;
        }

        .ref-date-row {
          display: flex !important;
          justify-content: space-between !important;
          margin-top: 3px !important;
          font-size: 13px !important;
        }
        .ref-date-row .ref-no {
          color: #000000 !important;
          font-weight: bold !important;
          font-style: italic !important;
        }
        .ref-date-row .date-text {
          color: #000000 !important;
          font-style: italic !important;
        }

        .to-section {
          margin: 12px 0 15px 0;
          line-height: 1.6;
        }
        .to-section .company-name {
          font-weight: bold;
          font-size: 16px;
        }
        .to-section .company-location {
          font-size: 14px;
          color: #374151;
        }
        .subject {
          font-weight: bold;
          margin: 12px 0 8px 0;
          font-size: 14px;
        }
        .dear-sir {
          margin: 8px 0 12px 0;
          line-height: 1.6;
        }
       
        /* SECTION TITLE - CENTERED ONLY FOR MODULE WISE COVERAGE */
        .section-title-center {
          font-weight: bold !important;
          text-decoration: underline !important;
          font-size: 15px !important;
          margin: 18px 0 10px 0 !important;
          color: #193A69 !important;
          text-align: center !important;
        }

        /* SECTION TITLE - LEFT ALIGNED FOR OTHERS */
        .section-title-left {
          font-weight: bold !important;
          text-decoration: underline !important;
          font-size: 15px !important;
          margin: 18px 0 10px 0 !important;
          color: #193A69 !important;
          text-align: left !important;
        }
       
        .pricing-section {
          margin: 15px 0;
        }
         /* page break: allow big module row to flow across pages */
        table {
          page-break-inside: auto;
        }
        tr, td {
          page-break-inside: auto;   /* row/cell ko todne do */
        }
        thead {
          display: table-header-group; /* header har page pe repeat */
        }
        /* pricing table ki choti rows na tute */
        .pricing-table tr {
          page-break-inside: avoid;
        }
        .section-title-center,
        .section-title-left {
          page-break-after: avoid;
        }
        .container {
          padding-top: 0 !important;
          padding-bottom: 20px !important;
        }
        .pricing-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin: 8px 0;
        }
        .pricing-table th {
          background-color: #193A69;
          color: white;
          padding: 6px 10px;
          text-align: left;
          border: 1px solid #1f2937;
        }
        .pricing-table td {
          padding: 6px 10px;
          border: 1px solid #1f2937;
        }
        .pricing-table .total-row {
          font-weight: bold;
          background-color: #f3f8fc;
        }
        .terms {
          margin: 15px 0;
          font-size: 13px;
          line-height: 1.8;
        }
        .terms ul {
          padding-left: 20px;
        }
        .assure-text {
          margin: 12px 0 8px 0;
          font-size: 13px;
        }
        .thankyou-text {
          font-size: 14px;
          margin: 8px 0 5px 0;
        }

    /* FOOTER / PROPOSAL ACCEPTANCE SECTION */
.proposal-acceptance {
  margin-top: 30px;
}
.proposal-acceptance .acceptance-row-top {
  display: flex;
  justify-content: space-between;
}
.proposal-acceptance .acceptance-row-bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}
.proposal-acceptance .left-label {
  font-weight: bold;
  text-align: left;
  width: 50%;
}
.proposal-acceptance .right-title {
  font-weight: bold;
  text-decoration: underline;
  text-align: right;
  width: 50%;
}
.proposal-acceptance .right-label {
  font-weight: bold;
  text-align: right;
  width: 50%;
}
        .signature-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          align-items: flex-end;
        }
        .signature-footer .signature-left {
          text-align: left;
        }
        .signature-footer .signature-right {
          text-align: right;
        }
        .signature-footer .signature-image {
          max-width: 150px;
          max-height: 60px;
          object-fit: contain;
          margin-bottom: 5px;
        }
        .signature-footer .signature-line {
          border-top: 1px solid #1f2937;
          width: 200px;
          margin: 5px 0 3px 0;
        }
        .signature-footer .signature-line-right {
          border-top: 1px solid #1f2937;
          width: 200px;
          margin: 5px 0 3px 0;
          margin-left: auto;
        }
        .signature-footer .authorized-text {
          font-size: 13px;
        }

        /* PRINT STYLES */
        @media print {
          body {
            padding: 0 10px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
         
          .header-left {
            background-color: #DC2626 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
         
          .header-left .brand-name,
          .header-left .brand-sub {
            color: #FFFFFF !important;
          }
         
          .pricing-table th {
            background-color: #193A69 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
         
          .pricing-table .total-row {
            background-color: #f3f8fc !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER - Three Column -->
        <div class="header">
          <!-- LEFT: Red Block with AUTO-VYN and AUTOMOBILE READY ERP -->
          <div class="header-left">
            <div class="brand-name">AUTO-VYN</div>
            <div class="brand-sub">AUTOMOBILE READY ERP</div>
          </div>
         
          <!-- CENTER: Logo + Colored AUTO-VYN text (Reduced Size) -->
          <div class="header-center">
            <img src="${logoPath}" alt="Logo" class="logo-img" onerror="this.style.display='none'" />
            <div class="colored-brand">
              <span class="red-char">A</span>
              <span class="yellow-char">U</span>
              <span class="blue-char">T</span>
              <span class="red-char">O</span>
              <span class="black-char">-</span>
              <span class="yellow-char">V</span>
              <span class="blue-char">Y</span>
              <span class="red-char">N</span>
            </div>
          </div>
         
          <!-- RIGHT: Company Details -->
          <div class="header-right">
            <div class="company-name">VYN Automation Pvt. Ltd.</div>
            <div class="tagline">
              <span class="red-text">(AUTOMATION</span>
              <span class="yellow-text">THROUGH</span>
              <span class="blue-text">TECHNOLOGY)</span>
            </div>
            <div class="website">Reach us at : www.Autovyn.com</div>
          </div>
        </div>

        <!-- DIVIDER LINE -->
        <hr class="header-divider" />

        <!-- REF NO & DATE ROW -->
        <div class="ref-date-row">
          <span class="ref-no">Ref.No: ${refNo}</span>
          <span class="date-text">Dated: ${formattedDate}</span>
        </div>

        <!-- TO SECTION -->
        <div class="to-section">
          <div>To,</div>
          <div class="company-name">${selectedClient.Company}</div>
          <div class="company-location">${selectedClient.Headquarters}</div>
        </div>

        <!-- GST NO -->
        <div style="margin: 8px 0; font-size: 13px; font-weight: 600;">
          GST No : ${selectedClient.GstNo || ""}
        </div>
        <!-- SUBJECT -->
        <div class="subject">${subjectLine}</div>

        <!-- DEAR SIR -->
        <div class="dear-sir">
          Dear Sir,
        </div>
        <div style="margin-bottom: 12px; line-height: 1.6; font-size: 13px;">
          This is reference to our discussion, regarding development of above software. We thank you for your kind interest shown in our organization and are pleased to submit our proposal for the same.
        </div>

        <!-- MODULE WISE COVERAGE - CENTERED -->
        <div class="section-title-center">Module wise Coverage</div>
        ${moduleWiseCoverageHTML}

        <!-- PRICING STRUCTURE - LEFT ALIGNED -->
        <div class="section-title-left">3. Pricing Structure</div>
       
        <div style="margin: 8px 0 4px 0; font-weight: bold; font-size: 14px;">One-Time Cost</div>
        <table class="pricing-table">
          <thead>
            <tr>
              <th style="width: 70%;">Description</th>
              <th style="width: 30%; text-align: right;">Cost (INR)</th>
            </tr>
          </thead>
          <tbody>
           <tr>
              <td>HRMS Setup, Implementation, Training</td>
              <td style="text-align: right;">₹ ${oneTimeSetupNum.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Special Promotional Discount (Valid till ${validTillStr})</td>
              <td style="text-align: right;">- ₹ ${oneTimeDiscountNum.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>One-Time Setup Total </td>
              <td style="text-align: right;">₹ ${oneTimeTotalNum.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

<table class="pricing-table">
  <thead>
    <tr>
      <th>${perUnitLabel}</th>
      <th>${unitCountLabel}</th>
      <th>Per Month Rate</th>
      <th>No. of Months</th>
      <th style="text-align:right">Amount</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>₹ ${(Number(actPerEmpRate) || 0).toFixed(2)}</td>
      <td>${Number(activeMult) || 0}</td>
      <td>₹ ${b.effectiveMonthly.toFixed(2)}</td>
      <td>${b.months}</td>
      <td style="text-align:right">₹ ${b.amount.toFixed(2)}</td>
    </tr>

    ${b.discPct > 0 ? `
    <tr>
      <td colspan="4" style=font-weight:600;">
        Discount (${b.discPct}%)
      </td>
      <td style="text-align:right">
        - ₹ ${b.discountAmt.toFixed(2)}
      </td>
    </tr>
    ` : ""}

    <tr>
      <td colspan="4" style="font-weight:600;">
        One-Time Setup Total
      </td>
      <td style="text-align:right">
        + ₹ ${b.oneTimeTotalNum.toFixed(2)}
      </td>
    </tr>
    <tr>
      <td colspan="4" style="font-weight:600;">
        Taxable Vaule
      </td>
      <td style="text-align:right">
        ₹ ${b.taxable.toFixed(2)}
      </td>
    </tr>

    <tr>
      <td colspan="4" style="font-weight:600;">
        GST (18%)
      </td>
      <td style="text-align:right">
        ₹ ${b.gst.toFixed(2)}
      </td>
    </tr>

    <tr style="font-weight:bold;font-size:15px;background:#f3f8fc;">
      <td colspan="4" >
        Total Amount
      </td>
      <td style="text-align:right;">
        ₹ ${b.grandTotal.toFixed(2)}
      </td>
    </tr>

  </tbody>
</table>

<div class="section-title-left" style="margin-top: 25px;">Important Note:</div>
<div style="margin: 8px 0 4px 0; font-weight: bold; font-size: 13px;">Bank Account Details for Payment:</div>
<table style="width:auto; border-collapse:collapse; font-size:13px; margin-bottom:12px;">
  <tr><td style="padding:2px 20px 2px 0; font-weight:bold;">Party Name</td><td style="padding:2px 0;">: VYN Automation Pvt. Ltd.</td></tr>
  <tr><td style="padding:2px 20px 2px 0; font-weight:bold;">Bank</td><td style="padding:2px 0;">: ICICI Bank</td></tr>
  <tr><td style="padding:2px 20px 2px 0; font-weight:bold;">Branch</td><td style="padding:2px 0;">: Jhotwara, Jaipur</td></tr>
  <tr><td style="padding:2px 20px 2px 0; font-weight:bold;">Account type</td><td style="padding:2px 0;">: Current</td></tr>
  <tr><td style="padding:2px 20px 2px 0; font-weight:bold;">Account No.</td><td style="padding:2px 0;">: 019705009882</td></tr>
  <tr><td style="padding:2px 20px 2px 0; font-weight:bold;">IFSC Code</td><td style="padding:2px 0;">: ICIC0006759</td></tr>
</table>

<div style="margin: 12px 0 4px 0; font-weight: bold; font-size: 14px;">Payment Terms</div>
<ul style="font-size:13px; line-height:1.8; padding-left:20px; margin-bottom:15px;">
  <li>All payments are to be made by cheque or demand draft payable at par in Jaipur, favoring 'VYN Automation Pvt. Ltd.' within 7 days from the date of the invoice/ Completion of Phases as mentioned in point no 7.</li>
  <li>In case of delayed payments, AUTOVYN reserves the right to withhold/suspend the project related work.</li>
</ul>


        <!-- TERMS & CONDITIONS - LEFT ALIGNED -->
        <div class="section-title-left" style="margin-top: 25px;">Terms & Conditions:</div>
        <div class="terms">
          <ul>
            ${termsHTML}
          </ul>
        </div>

        <!-- ASSURANCE & THANK YOU -->
        <div class="assure-text">
          We assure you best attention and cooperation at all the times. We look forward for a long association with your organization.
        </div>
        <div class="thankyou-text">
          Thanking You,
        </div>

      <!-- PROPOSAL ACCEPTANCE NOTE FOOTER -->
<div class="proposal-acceptance">
  <div class="acceptance-row-top">
    <div class="left-label"></div>
    <div class="right-title">Proposal Acceptance Note:</div>
  </div>
  <div class="acceptance-row-bottom">
    <div class="left-label">For - VYN Automation Pvt. Ltd.</div>
    <div class="right-label">For - ${selectedClient.Company}</div>
  </div>
</div>

        <!-- SIGNATURE FOOTER WITH IMAGE -->
        <div class="signature-footer">
          <div class="signature-left">
            ${signatureHTML}
            <div class="signature-line"></div>
            <div class="authorized-text">Authorized Signatory</div>
          </div>
          <div class="signature-right">
            <div style="height: 54px;"></div>
            <div class="signature-line-right"></div>
            <div class="authorized-text">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;
  };

  // Handle Submit Quotation
  const handleSubmitQuotation = async () => {
    if ((Number(oneTimeDiscount) || 0) > (Number(oneTimeSetup) || 0)) {
      showSideAlert("The one-time discount cannot exceed the setup price.", "error");
      setIsLoading(false);
      return;
    }
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "This action is irreversible and cannot be undone. Do you want to proceed?",
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      showCancelButton: true,
    });

    if (!confirmed.isConfirmed) return;

    try {
      setIsLoading(true);

      const mobileNo = form.Mobile;
      if (!mobileNo) {
        showSideAlert("Mobile number is required", "error");
        return;
      }



      // ✅ RECALCULATE EMPLOYEE RANGE BASED ON EXACT COUNT
      let finalEmployeeRange = form.Employees;

      if (employeeWiseCost.isEmployeeWise === "Yes" && employeeWiseCost.exactEmployeeCount) {
        const count = parseFloat(employeeWiseCost.exactEmployeeCount);
        const sortedRanges = [...empRanges].sort((a, b) => a.Misc_Code - b.Misc_Code);
        let targetRange = null;
        let previousRange = null;

        // Find which range the count falls into
        for (let i = 0; i < sortedRanges.length; i++) {
          const range = sortedRanges[i];
          const rangeValue = parseInt(range.Misc_Name.replace(/[^0-9]/g, ''));
          if (count <= rangeValue) {
            targetRange = range;
            if (i > 0) previousRange = sortedRanges[i - 1];
            break;
          }
        }

        // If count is greater than all ranges, use the last range
        if (!targetRange && sortedRanges.length > 0) {
          targetRange = sortedRanges[sortedRanges.length - 1];
          previousRange = sortedRanges[sortedRanges.length - 2] || sortedRanges[sortedRanges.length - 1];
        }

        if (targetRange) {
          finalEmployeeRange = String(targetRange.Misc_Code);
        }
      }
      // master selected ka text + optional non-empty, sab ek string mein
      const selectedTexts = masterTerms
        .filter((t: any) => selectedTerms.includes(t.code))
        .map((t: any) => t.text);
      const optTexts = optionalTerms.filter((x) => x && x.trim() !== "");
      const allTermsArr = [...selectedTexts, ...optTexts];
      const termsDetails = allTermsArr.join(TERMS_DELIM);
      const termsSelected = selectedTerms.join(",");

      // ✅ optional 5 ko hamesha index ke saath store (blank bhi), taaki position bani rahe
      const optionalJoined = optionalTerms.join(TERMS_DELIM);

      // Quotation number backend se lao (prefix + next no)
      let curPrefix = quotPrefix;
      let curNo = quotNo;
      try {
        const qnRes = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/getNextQuotNo`, { LINK_UTD: clientUTD }, reqHeaders);
        if (qnRes.data?.Status) {
          curPrefix = qnRes.data.Data?.prefix || "VYNHR-2026";
          curNo = qnRes.data.Data?.nextNo ?? null;
          setQuotPrefix(curPrefix);
          setQuotNo(curNo);
        }
      } catch (err) {
        console.error("getNextQuotNo failed", err);
      }

      // Generate the same print HTML
      const printHTML = generatePrintHTML(curPrefix, curNo);

      // effective monthly = edited per-emp rate × multiplier (warna original total)
      const effMonthly = (() => {
        const er = parseFloat(actPerEmpRate);
        const m = Number(activeMult) || 0;
        return (!isNaN(er) && m > 0) ? er * m : Number(total);
      })();

      // ✅ SEND WITH CORRECT EMPLOYEE RANGE
      const response = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/sendQuotationWhatsApp`, {
        LINK_UTD: clientUTD,
        MOBILE: mobileNo,
        COMPANY_NAME: form.Company,
        TOTAL_AMOUNT: effMonthly,
        ACT_PER_EMP_RATE: actPerEmpRate !== "" ? Number(actPerEmpRate) : null,
        EMP_MULTIPLIER: activeMult,
        CUSTOM_DISCOUNT_PER: customDiscount !== "" ? Number(customDiscount) : null,
        PLAN_NAME: planLabel,
        PRINT_HTML: printHTML,
        EMPLOYEE_RANGE: finalEmployeeRange, // ✅ USE CALCULATED RANGE
        PAYMENT_TERMS_CODE: paymentTerm,
        TERMS_SELECTED: termsSelected,   // ✅
        TERMS_DETAILS: termsDetails,
        OPTIONAL_TERMS: optionalJoined,
        ONETIME_SETUP: Number(oneTimeSetup) || 0,
        ONETIME_DISCOUNT: Number(oneTimeDiscount) || 0,
        ONETIME_TOTAL: (Number(oneTimeSetup) || 0) - (Number(oneTimeDiscount) || 0),
        QUOT_NO: curNo,
        QUOTATION_PREFIX: curPrefix,
      }, reqHeaders);

      if (response.data?.Status) {
        showSideAlert("Quotation submitted and WhatsApp sent successfully!", "success");
        await fetchList();
        backToList();
      } else {
        showSideAlert(response.data?.Message || "Failed to send WhatsApp", "error");
      }
    } catch (e) {
      console.error(e);
      showSideAlert("Error submitting quotation", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const [showLogModal, setShowLogModal] = useState(false);
  const [policyLogs, setPolicyLogs] = useState([]);
  const fetchClientHistory = async (utd) => {
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getClientDocumentHistory`,
        {
          utd,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (response.data.success) {
        setPolicyLogs(response.data.data || []);
        setShowLogModal(true);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Unable to load history",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const filtered = clients.filter((c) => (c.Company || "").toLowerCase().includes(search.toLowerCase()));
  const planLabel = PLAN_OPTIONS.find((p) => p.value === plan)?.label || "";

  const stepTitle =
    view === "form" ? (isEdit ? "Edit Client" : "New Quotation") :
      view === "modules" ? "Modules & Plan" :
        view === "preview" ? "Preview & Submit" : "Client Intake Form";

  /* ================================================================ */
  return (
    <div className="pb-6">
      {/* Brand banner */}
      <div className="rounded-t-xl bg-gradient-to-r from-white via-white to-[#f4f7ff] dark:from-[#0a0a0a] dark:to-black border border-borderColor dark:border-borderColor-dark flex flex-col md:flex-row md:items-center gap-4 px-4 md:px-7 py-4">
        <div className="flex items-center gap-3">
          <Image src="/hr-setu-logo.png" alt="HR Setu" width={64} height={56} className="object-contain h-12 w-auto" />
          <Image src="/hr-setu-lable.png" alt="HR Setu" width={120} height={48} className="object-contain h-10 w-auto" />
        </div>
        <div className="md:ml-auto md:text-right">
          <p className="text-sm md:text-base font-extrabold text-[#1f2d4d] dark:text-[#37a9dd] leading-snug">
            Smarter Payroll. Faster Operations. Stronger Growth.
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            The complete HRMS built for multi-branch organizations.
          </p>
        </div>
      </div>

      {/* Header bar */}
      <div className="bg-gradient-to-r from-[#16223d] to-[#26365c] dark:from-black dark:to-[#0c0c0c] px-3 md:px-7 py-3 border-x border-borderColor dark:border-borderColor-dark">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h1 className="font-extrabold text-base md:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase tracking-wide">
            <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"><IcoQuote /></span>
            {stepTitle}
          </h1>
          <div className="flex gap-2">
            {view === "list" ? (
              <>
                {/* <Button variant={"print"} onClick={handlePrint}>
                  <IcoPrint /> Print
                </Button> */}
                <Button variant={"save"} onClick={openAdd}>+ Add Client</Button>
                <Button variant={"print"} onClick={() => window.history.back()}>Back</Button>
              </>
            ) : view === "form" ? (
              <Button variant={"print"} onClick={backToList}>Cancel</Button>
            ) : view === "preview" ? (
              <Button variant={"print"} onClick={() => { setView("modules"); window.scrollTo({ top: 0 }); }}>← Back</Button>
            ) : (
              <Button variant={"print"} onClick={() => { setView("form"); window.scrollTo({ top: 0 }); }}>Back</Button>
            )}
          </div>
        </div>
      </div>

      {/* ===================== LIST VIEW ===================== */}
      {view === "list" && (
        <div className="rounded-b-xl p-3 md:p-5 bg-white dark:bg-black border-x border-b border-borderColor dark:border-borderColor-dark shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm md:text-base font-extrabold text-[#1f2d4d] dark:text-gray-200 uppercase tracking-wide">Clients &amp; Quotations</h2>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400"><IcoSearch /></span>
              <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="border border-borderColor dark:border-borderColor-dark rounded-lg pl-9 pr-3 py-2 text-sm bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 w-full sm:w-72" />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-borderColor dark:border-borderColor-dark">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#fafbfe] dark:bg-[#111] text-left text-[#1f2d4d] dark:text-gray-300 uppercase text-[11px] tracking-wide">
                  <th className="px-4 py-3 font-extrabold">Company</th>
                  <th className="px-4 py-3 font-extrabold">Industry</th>
                  <th className="px-4 py-3 font-extrabold">Employees</th>
                  <th className="px-4 py-3 font-extrabold">Stakeholder</th>
                  <th className="px-4 py-3 font-extrabold">Contact</th>
                  <th className="px-4 py-3 font-extrabold">Headquarters</th>
                  <th className="px-4 py-3 font-extrabold">Status</th>
                  <th className="px-4 py-3 font-extrabold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor dark:divide-borderColor-dark">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-14 text-center text-gray-400">
                    <div className="font-bold text-gray-600 dark:text-gray-300 text-base mb-1">No clients yet</div>
                    Click “+ Add Client” to capture your first organization and start a quotation.
                  </td></tr>
                ) : (
                  filtered.map((c) => {
                    return (
                      <tr key={c.UTD} className="hover:bg-[#fafcff] dark:hover:bg-[#0c0c0c] text-black dark:text-white transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold flex items-center gap-2">
                            {c.Company}
                            <span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap " + (c.QuotationType === 2 ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400")}>
                              {c.QuotationType === 2 ? "Demo Car" : "Payroll & HRMS"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{c.Designation}</div>
                        </td>
                        <td className="px-4 py-3.5"><span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold whitespace-nowrap">{c.Industry || "—"}</span></td>
                        <td className="px-4 py-3.5 font-medium">{c.QuotationType === 2 ? `${c.DemoCarCount || 0} cars` : (empRangeMap[String(c.Employees)] || c.Employees || "—")}</td>
                        <td className="px-4 py-3.5">{c.Stakeholder || "—"}</td>
                        <td className="px-4 py-3.5"><div>{c.Email || "—"}</div><div className="text-xs text-gray-400">{c.Mobile}</div></td>
                        <td className="px-4 py-3.5">{c.Headquarters || "—"}</td>
                        <td className="px-4 py-3.5"><span className="inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{c.Status || "—"}</span></td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5 justify-center">
                            {/* 👇 PDF button — sabse pehle */}
                            {c.PdfPath && (
                              <button
                                title="View PDF"
                                onClick={() =>
                                  window.open(
                                    `https://erp.autovyn.com/backend/fetch?filePath=${encodeURIComponent(c.PdfPath)}`,
                                    "_blank"
                                  )
                                }
                                className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                              >
                                <IcoPrint />
                              </button>
                            )}
                            {c.PdfPath && (
                              <button
                                title="View History"
                                onClick={() => fetchClientHistory(c.UTD)}
                                className="p-1.5 rounded-md text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition"
                              >
                                <HistoryIcon size={18} />
                              </button>)}
                            <button title="Edit" onClick={() => openEdit(c)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"><IcoEdit /></button>
                            <button title="Delete" onClick={() => deleteClient(c)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"><IcoTrash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-500">Showing {filtered.length} of {clients.length} clients</div>
        </div>
      )}

      {/* ===================== FORM VIEW (Step 1) ===================== */}
      {view === "form" && (
        <div className="rounded-b-xl bg-white dark:bg-black border-x border-b border-borderColor dark:border-borderColor-dark shadow-md">
          <Stepper active={1} />
          <div className="px-4 md:px-6 pt-4">
            <h3 className="text-base md:text-lg font-extrabold text-[#1f2d4d] dark:text-[#37a9dd]">Organization Information</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Capture the company's basic details to initiate the quotation process.</p>
          </div>
          <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 mb-3">
            <div className="xl:col-span-12 col-span-12">
              <Eselect h={"9"} title="QUOTATION TYPE" name="QuotationType" initialValue={String(form.QuotationType)} option={QUOTATION_TYPES} handleInputChange={handleChange} redlabel="*" disabled={isEdit} />
              {errors.QuotationType && <p className="text-xs text-red-500 mt-1">{errors.QuotationType}</p>}
            </div>
            <div className="xl:col-span-6 lg:col-span-6 md:col-span-12 col-span-12">
              <Ainput title="COMPANY NAME (LEGAL ENTITY)" type="text" name="Company" value={form.Company} handleInputChange={handleChange} redlabel="*" />
              {errors.Company && <p className="text-xs text-red-500 mt-1">{errors.Company}</p>}
            </div>
            <div className="xl:col-span-3 lg:col-span-3 md:col-span-6 col-span-12">
              <Eselect h={"9"} title="INDUSTRY BRANCH CATEGORY" name="Industry" initialValue={form.Industry} option={INDUSTRIES} handleInputChange={handleChange} isSearchable />
              {errors.Industry && <p className="text-xs text-red-500 mt-1">{errors.Industry}</p>}
            </div>
            <div className="xl:col-span-3 lg:col-span-3 md:col-span-6 col-span-12">
              <Ainput title="PRIMARY STAKEHOLDER NAME" type="text" name="Stakeholder" value={form.Stakeholder} handleInputChange={handleChange} redlabel="*" />
              {errors.Stakeholder && <p className="text-xs text-red-500 mt-1">{errors.Stakeholder}</p>}
            </div>
            {form.QuotationType === 2 ? (
              <div className="xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-12">
                <Ainput title="TOTAL NUMBER OF DEMO CARS" type="number" name="DemoCarCount" value={form.DemoCarCount} handleInputChange={handleChange} redlabel="*" min={1} />
                {errors.DemoCarCount && <p className="text-xs text-red-500 mt-1">{errors.DemoCarCount}</p>}
              </div>
            ) : (
              <div className="xl:col-span-12 col-span-12">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Total Employee Count <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2.5">
                  {empRanges.length === 0 ? (
                    <span className="text-xs text-gray-400">Loading ranges…</span>
                  ) : (
                    empRanges.map((r: any) => {
                      const code = String(r.Misc_Code);
                      const active = String(form.Employees) === code;
                      return (
                        <label key={code} className="cursor-pointer">
                          <input type="radio" name="Employees" value={code} checked={active} onChange={() => handleChange("Employees", code)} className="sr-only peer" />
                          <span className={"inline-block rounded-lg border px-5 py-2.5 text-sm font-bold transition select-none " +
                            (active ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm" : "border-borderColor dark:border-borderColor-dark text-gray-600 dark:text-gray-300 hover:border-blue-300")}>{r.Misc_Name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                {errors.Employees && <p className="text-xs text-red-500 mt-1">{errors.Employees}</p>}
              </div>
            )}
            <div className="xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-12">
              <Ainput title="CORPORATE DESIGNATION" type="text" name="Designation" value={form.Designation} handleInputChange={handleChange} />
              {errors.Designation && <p className="text-xs text-red-500 mt-1">{errors.Designation}</p>}
            </div>
            <div className="xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-12">
              <Ainput title="EMAIL ADDRESS" type="email" name="Email" value={form.Email} handleInputChange={handleChange} redlabel="*" />
              {errors.Email && <p className="text-xs text-red-500 mt-1">{errors.Email}</p>}
            </div>
            <div className="xl:col-span-4 lg:col-span-4 md:col-span-6 col-span-12">
              <Ainput title="MOBILE NUMBER" type="number" name="Mobile" value={form.Mobile} handleInputChange={handleChange} redlabel="*" max={10} />
              {errors.Mobile && <p className="text-xs text-red-500 mt-1">{errors.Mobile}</p>}
            </div>
            <div className="xl:col-span-6 lg:col-span-6 md:col-span-6 col-span-12">
              <Ainput title="GEOGRAPHIC HEADQUARTERS" type="text" name="Headquarters" value={form.Headquarters} handleInputChange={handleChange} />
              {errors.Headquarters && <p className="text-xs text-red-500 mt-1">{errors.Headquarters}</p>}
            </div>
            <div className="xl:col-span-6 lg:col-span-6 md:col-span-6 col-span-12">
              <Ainput
                title="GST NUMBER"
                type="text"
                name="GstNo"
                value={(form.GstNo || "").toUpperCase()}
                // handleInputChange={(e) => {
                //   e.target.value = e.target.value.toUpperCase();
                //   handleChange(e);
                // }}
                handleInputChange={handleChange}
              />
              {errors.GstNo && (
                <p className="text-xs text-exit mt-1">{errors.GstNo}</p>
              )}
            </div>
          </div>
          <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-3 mb-5">
            <div className="xl:col-span-12 col-span-12">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Legacy Infrastructure Context</label>
              <textarea rows={3} name="Legacy" value={form.Legacy} maxLength={LEGACY_MAX} onChange={(e) => handleChange("Legacy", e.target.value)}
                placeholder="Current incumbent systems for migration scoping"
                className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg p-3 text-sm bg-white dark:bg-black text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400" />
              <div className="text-[11px] text-gray-400 mt-1">{form.Legacy.length}/{LEGACY_MAX} characters · optional</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-between items-center border-t border-borderColor dark:border-borderColor-dark px-4 md:px-6 py-4 bg-[#fafbfe] dark:bg-[#0a0a0a] rounded-b-xl">
            <span className="text-xs text-gray-400">Fields marked <span className="text-red-500">*</span> are mandatory.</span>
            <div className="flex gap-3">
              <Button variant={"print"} onClick={resetForm}>Reset</Button>
              <Button variant={"save"} onClick={handleSaveNext}>{isEdit ? "Update & Next →" : "Save & Next →"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODULES VIEW (Step 2) ===================== */}
      {view === "modules" && (
        <div className="rounded-b-xl bg-white dark:bg-black border-x border-b border-borderColor dark:border-borderColor-dark shadow-md">
          <Stepper active={2} />
          <div className="px-4 md:px-6 pt-4">
            <h3 className="text-base md:text-lg font-extrabold text-[#1f2d4d] dark:text-[#37a9dd]">Select Plan &amp; Modules</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Standard pre-selects standard modules (locked, add-ons allowed). Growth Package selects everything (locked). Enterprise lets you pick freely.
            </p>
            {!isDemoCar && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                <div className="xl:col-span-4 lg:col-span-5 md:col-span-6 col-span-12">
                  <div className="xl:col-span-4 lg:col-span-5 md:col-span-6 col-span-12">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                      PLAN <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                      value={plan || ""}
                      onChange={(e) => handlePlanChange("Plan", e.target.value)}
                    >
                      <option value="">Select Plan</option>
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 md:px-6 pb-4">
            {sections.length === 0 ? (
              <div className="rounded-lg border border-borderColor dark:border-borderColor-dark p-10 text-center text-gray-400">
                No modules loaded. Check the module-master API.
              </div>
            ) : (
              <div className="rounded-lg border border-borderColor dark:border-borderColor-dark overflow-hidden">
                {sections.map((sec) => {
                  // standalone header (no children) -> the header itself is selectable
                  if (sec.standalone) {
                    const checked = selectedTags.has(String(sec.header.TAG));
                    return (
                      <div key={sec.header.UTD} className="border-b last:border-b-0 border-borderColor dark:border-borderColor-dark">
                        <label className={`flex items-center gap-3 bg-[#fafbfe] dark:bg-[#111] px-4 py-2.5 ${isAllDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-blue-600"
                            checked={checked}
                            onChange={() => toggleTag(String(sec.header.TAG))}

                          />
                          <span className={"font-bold text-sm " + (checked ? "text-blue-600 dark:text-blue-300" : "text-[#1f2d4d] dark:text-gray-200")}>
                            {sec.header.TAG}. {sec.header.MODULE_NAME}
                          </span>
                        </label>
                      </div>
                    );
                  }
                  // normal section -> group header toggles all child tags
                  const st = sectionState(sec.children);
                  return (
                    <div key={sec.header.UTD} className="border-b last:border-b-0 border-borderColor dark:border-borderColor-dark">
                      <label className={`flex items-center gap-3 bg-[#fafbfe] dark:bg-[#111] px-4 py-2.5 ${isAllDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-600"
                          checked={st === "all"}
                          ref={(el) => { if (el) el.indeterminate = st === "some"; }}
                          onChange={() => toggleSection(sec.children)}

                        />
                        <span className="font-bold text-[#1f2d4d] dark:text-gray-200 text-sm">{sec.header.TAG}. {sec.header.MODULE_NAME}</span>
                      </label>
                      <div className="px-4 py-2 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        {sec.children.map((c) => {
                          const checked = selectedTags.has(String(c.TAG));
                          return (
                            <label key={c.UTD} className={`flex items-center gap-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-300 ${isAllDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-600"
                                checked={checked}
                                onChange={() => toggleTag(String(c.TAG))}

                              />
                              <span className={checked ? "text-blue-600 dark:text-blue-300 font-medium" : ""}>{c.MODULE_NAME}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Employee Wise Cost Section */}
          {user?.role1?.includes("19.1.1") && !isDemoCar && (
            <div className="border-t border-borderColor dark:border-borderColor-dark px-4 md:px-6 py-4 bg-[#fafbfe] dark:bg-[#0a0a0a]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="xl:col-span-4 lg:col-span-5 md:col-span-6 col-span-12">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                    EMPLOYEE WISE COST
                  </label>
                  <select
                    className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                    value={employeeWiseCost.isEmployeeWise}
                    onChange={(e) => {
                      setEmployeeWiseCost({
                        ...employeeWiseCost,
                        isEmployeeWise: e.target.value,
                        exactEmployeeCount: e.target.value === "No" ? "" : employeeWiseCost.exactEmployeeCount
                      });
                    }}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="xl:col-span-4 lg:col-span-5 md:col-span-6 col-span-12">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                    EXACT NUMBER OF EMPLOYEES
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                    value={employeeWiseCost.exactEmployeeCount}
                    onChange={(e) => handleEmployeeCountChange(e.target.value)}
                    disabled={employeeWiseCost.isEmployeeWise === "No"}
                    placeholder={employeeWiseCost.isEmployeeWise === "Yes" ? "Enter exact count" : "Disabled"}
                  />
                  {employeeWiseCost.isEmployeeWise === "Yes" && !employeeWiseCost.exactEmployeeCount && (
                    <p className="text-xs text-red-500 mt-1">Please enter the exact number of employees</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Terms & Conditions Section */}
          <div className="border-t border-borderColor dark:border-borderColor-dark px-4 md:px-6 py-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
              Terms &amp; Conditions
            </label>

            {/* master terms checkboxes */}
            <div className="space-y-2 mb-4">
              {masterTerms.length === 0 ? (
                <span className="text-xs text-gray-400">Loading terms…</span>
              ) : (
                masterTerms.map((t: any) => {
                  const checked = selectedTerms.includes(t.code);
                  return (
                    <label key={t.code} className="flex items-start gap-2.5 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-600 mt-0.5"
                        checked={checked}
                        onChange={() => handleTerm(t.code)}
                      />
                      <span className={checked ? "text-blue-600 dark:text-blue-300" : ""}>{t.text}</span>
                    </label>
                  );
                })
              )}
            </div>

            {/* optional terms 1..5 */}
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Optional Terms (max 500 chars each)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {optionalTerms.map((val, idx) => (
                <div key={idx}>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={val}
                    onChange={(e) => handleOptionalTerm(idx, e.target.value)}
                    placeholder={`Optional Term ${idx + 1}`}
                    className="w-full border border-borderColor dark:border-borderColor-dark rounded-lg p-2.5 text-sm bg-white dark:bg-black text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
                  />
                  <div className="text-[10px] text-gray-400 mt-0.5">{val.length}/500</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-between items-center border-t border-borderColor dark:border-borderColor-dark px-4 md:px-6 py-4 bg-[#fafbfe] dark:bg-[#0a0a0a] rounded-b-xl">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">{planLabel ? `Plan: ${planLabel} · ` : ""}{selectedCount} modules selected</span>
              {employeeWiseCost.isEmployeeWise === "Yes" && employeeWiseCost.exactEmployeeCount && (
                <span className="ml-2 text-xs text-gray-400">
                  ({employeeWiseCost.exactEmployeeCount} employees × module total)
                </span>
              )}
              <span className="ml-3 font-extrabold text-[#1f2d4d] dark:text-[#37a9dd]">
                Total: ₹ {total.toFixed(2)} <span className="text-xs font-normal text-gray-400">({activeMult} × ₹ {activePerEmp.toFixed(2)})</span>
              </span>
            </div>
            <Button variant={"save"} onClick={handleStep2Save}>Save &amp; Preview →</Button>
          </div>
        </div>
      )}
      {view === "preview" && renderPreview()}

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

            {/* Header */}
            <div className="bg-gradient-to-r from-header to-header/80 px-6 py-5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <History className="w-6 h-6" />
                  Document History
                </h2>
                <p className="text-white/70 text-sm">
                  View all document versions
                </p>
              </div>

              <button
                onClick={() => setShowLogModal(false)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6">

              {policyLogs.length === 0 ? (
                <div className="text-center py-20">
                  <History className="mx-auto w-12 h-12 text-gray-400 mb-3" />
                  <h3 className="text-xl font-semibold">
                    No Document History Found
                  </h3>
                </div>
              ) : (

                <table className="w-full border rounded-lg overflow-hidden">

                  <thead className="bg-gray-100 dark:bg-[#202020]">

                    <tr>
                      <th className="px-4 py-3 text-left">Updated Date</th>
                      <th className="px-4 py-3 text-left">Updated By</th>
                      <th className="px-4 py-3 text-left">Previous PDF</th>
                      <th className="px-4 py-3 text-left">Current PDF</th>
                    </tr>

                  </thead>

                  <tbody>

                    {policyLogs.map((log, index) => (

                      <tr
                        key={index}
                        className="border-t hover:bg-gray-50 dark:hover:bg-[#181818]"
                      >

                        <td className="px-4 py-3">
                          {log.updated_at
                            ? new Date(log.updated_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "-"}
                        </td>

                        <td className="px-4 py-3">
                          {log.updated_by || "SYSTEM"}
                        </td>

                        <td className="px-4 py-3">
                          {log.old_pdf ? (
                            <button
                              onClick={() =>
                                window.open(
                                  `https://erp.autovyn.com/backend/fetch?filePath=${encodeURIComponent(
                                    log.old_pdf
                                  )}`,
                                  "_blank"
                                )
                              }
                              className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              View Previous
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {log.new_pdf ? (
                            <button
                              onClick={() =>
                                window.open(
                                  `https://erp.autovyn.com/backend/fetch?filePath=${encodeURIComponent(
                                    log.new_pdf
                                  )}`,
                                  "_blank"
                                )
                              }
                              className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              View Current
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              )}

            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 flex justify-between items-center">

              <span className="text-sm">
                Total Versions : <b>{policyLogs.length}</b>
              </span>

              <Button
                variant="outline"
                onClick={() => setShowLogModal(false)}
              >
                Close
              </Button>

            </div>

          </div>
        </div>
      )}
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}

/* ---- shared stepper ---- */
function Stepper({ active }: { active: number }) {
  const steps = [
    { n: 1, t: "Organization Info" },
    { n: 2, t: "Modules & Plan" },
    { n: 3, t: "Pricing" },
    { n: 4, t: "Review & Send" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 pt-5 pb-4 border-b border-[#E5E7EB] dark:border-[#2D2D2D]">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 text-xs md:text-[13px] font-semibold ${s.n === active
                ? "text-[#2563EB]"
                : "text-[#9CA3AF]"
              }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${s.n === active
                  ? "bg-[#2563EB] text-[#FFFFFF]"
                  : "bg-[#E5E7EB] dark:bg-[#222222] text-[#6B7280]"
                }`}
            >
              {s.n}
            </span>

            {s.t}
          </span>

          {i < steps.length - 1 && (
            <span className="w-7 h-[2px] bg-[#E5E7EB] dark:bg-[#222222] rounded" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40 text-gray-500">Loading...</div>}>
      <ClientIntakeContent />
    </Suspense>
  );
}