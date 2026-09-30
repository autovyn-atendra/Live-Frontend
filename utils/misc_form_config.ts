// utils/misc_form_config.ts

export interface FieldConfig {
  key          : string;
  label        : string;
  type         : "text" | "number" | "select" | "textarea" | "date";
  required     : boolean;
  placeholder ?: string;
  options     ?: { label: string; value: string | number }[];
  hint        ?: string;
  maxLength   ?: number;
}

export interface MiscFormConfig {
  Misc_Type : number;
  title     : string;
  fields    : FieldConfig[];
}

export const MISC_FORM_CONFIGS: Record<string, MiscFormConfig> = {

  "1": {
    Misc_Type : 1,
    title     : "District Master",
    fields    : [
      { key: "Misc_Name", label: "District Name", type: "text", required: true,  placeholder: "e.g. Mumbai, Delhi", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",    type: "text", required: false, placeholder: "e.g. MUM, DEL",     maxLength: 50 },
    ],
  },

  "3": {
    Misc_Type : 3,
    title     : "State Master",
    fields    : [
      { key: "Misc_Name", label: "State Name",  type: "text", required: true,  placeholder: "e.g. Maharashtra, Delhi", maxLength: 75 },
      { key: "Misc_Abbr", label: "State Code",  type: "text", required: false, placeholder: "e.g. MH, DL",            maxLength: 50 },
    ],
  },

  "11": {
    Misc_Type : 11,
    title     : "Department Master",
    fields    : [
      { key: "Misc_Name", label: "Department Name", type: "text", required: true,  placeholder: "e.g. Sales, HR, Finance", maxLength: 75, hint: "Links with EMPLOYEEMASTER.DEPT" },
      { key: "Misc_Abbr", label: "Short Code",      type: "text", required: false, placeholder: "e.g. HR, FIN",            maxLength: 50 },
    ],
  },

  "17": {
    Misc_Type : 17,
    title     : "Enquiry Source Master",
    fields    : [
      { key: "Misc_Name", label: "Source Name",   type: "text", required: true,  placeholder: "e.g. Walk-in, Digital", maxLength: 75 },
      { key: "Misc_Abbr", label: "Abbreviation",  type: "text", required: false, placeholder: "Short code",            maxLength: 50 },
    ],
  },

  "18": {
    Misc_Type : 18,
    title     : "Payment Mode Master",
    fields    : [
      { key: "Misc_Name", label: "Payment Mode", type: "text", required: true,  placeholder: "e.g. Cash, UPI, NEFT", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",   type: "text", required: false, placeholder: "e.g. UPI, CASH",       maxLength: 50 },
      { key: "Misc_Dtl1", label: "Detail",       type: "text", required: false, placeholder: "Additional info",      maxLength: 50 },
    ],
  },

  "19": {
    Misc_Type : 19,
    title     : "Cancel Reason Master",
    fields    : [
      { key: "Misc_Name", label: "Cancel Reason", type: "text", required: true,  placeholder: "e.g. Customer not interested", maxLength: 75 },
      { key: "Misc_Dtl1", label: "Detail",        type: "text", required: false, placeholder: "Additional info",              maxLength: 50 },
    ],
  },

  "31": {
    Misc_Type : 31,
    title     : "Product Group Master",
    fields    : [
      { key: "Misc_Name", label: "Group Name",  type: "text", required: true,  placeholder: "e.g. Spares, Accessories", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",  type: "text", required: false, placeholder: "e.g. SPA, ACC",            maxLength: 50 },
      { key: "Misc_Dtl1", label: "Detail 1",    type: "text", required: false, placeholder: "Additional detail",        maxLength: 50 },
    ],
  },

  "32": {
    Misc_Type : 32,
    title     : "Mechanic Master",
    fields    : [
      { key: "Misc_Name",  label: "Mechanic Name", type: "text", required: true,  placeholder: "Enter mechanic name",     maxLength: 75 },
      { key: "Misc_Mob",   label: "Mobile Number", type: "text", required: false, placeholder: "10-digit mobile",         maxLength: 50 },
      { key: "Misc_Phon",  label: "Phone",         type: "text", required: false, placeholder: "Phone number",            maxLength: 50 },
      { key: "Misc_Desig", label: "Designation",   type: "text", required: false, placeholder: "e.g. Senior Mechanic",   maxLength: 50 },
      { key: "Misc_Add1",  label: "Address",       type: "text", required: false, placeholder: "Address",                maxLength: 70 },
      { key: "Join_Date",  label: "Joining Date",  type: "date", required: false },
    ],
  },

  "51": {
    Misc_Type : 51,
    title     : "Tyre Master",
    fields    : [
      { key: "Misc_Name", label: "Tyre Name",  type: "text", required: true,  placeholder: "e.g. 185/65 R15", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code", type: "text", required: false, placeholder: "Short code",      maxLength: 50 },
      { key: "Misc_Dtl1", label: "Brand",      type: "text", required: false, placeholder: "Brand name",      maxLength: 50 },
      { key: "Misc_Dtl2", label: "Size",       type: "text", required: false, placeholder: "Tyre size",       maxLength: 50 },
    ],
  },

  "54": {
    Misc_Type : 54,
    title     : "Tyre Category Master",
    fields    : [
      { key: "Misc_Name", label: "Category Name", type: "text", required: true,  placeholder: "e.g. Radial, Bias", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",    type: "text", required: false, placeholder: "Short code",        maxLength: 50 },
    ],
  },

  "58": {
    Misc_Type : 58,
    title     : "Chapter Type Master",
    fields    : [
      { key: "Misc_Name", label: "Chapter Name",  type: "text", required: true,  placeholder: "e.g. Chapter 87", maxLength: 75, hint: "GST/HSN tariff codes" },
      { key: "Misc_Abbr", label: "HSN Code",      type: "text", required: false, placeholder: "HSN code",        maxLength: 50 },
      { key: "Misc_Dtl1", label: "Description",   type: "text", required: false, placeholder: "Description",     maxLength: 50 },
    ],
  },

  "59": {
    Misc_Type : 59,
    title     : "Bank Name Master",
    fields    : [
      { key: "Misc_Name", label: "Bank Name",      type: "text", required: true,  placeholder: "e.g. State Bank of India", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Name",     type: "text", required: false, placeholder: "e.g. SBI, HDFC",          maxLength: 50 },
      { key: "Misc_Add1", label: "Branch Address", type: "text", required: false, placeholder: "Branch address",          maxLength: 70 },
      { key: "Misc_Add2", label: "City",           type: "text", required: false, placeholder: "City",                    maxLength: 70 },
      { key: "Misc_Phon", label: "Phone",          type: "text", required: false, placeholder: "Contact number",          maxLength: 50 },
    ],
  },

  "60": {
    Misc_Type : 60,
    title     : "Customer Segment Master",
    fields    : [
      { key: "Misc_Name", label: "Segment Name", type: "text", required: true,  placeholder: "e.g. Premium, Economy", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",   type: "text", required: false, placeholder: "Short code",            maxLength: 50 },
    ],
  },

  "61": {
    Misc_Type : 61,
    title     : "Customer Category Master",
    fields    : [
      { key: "Misc_Name", label: "Category Name", type: "text", required: true,  placeholder: "e.g. Individual, Corporate", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",    type: "text", required: false, placeholder: "Short code",                maxLength: 50 },
    ],
  },

  "90": {
    Misc_Type : 90,
    title     : "Employee Shift Master",
    fields    : [
      { key: "Misc_Name", label: "Shift Name",   type: "text", required: true,  placeholder: "e.g. Morning Shift, Night Shift", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",   type: "text", required: false, placeholder: "e.g. MS, NS",                     maxLength: 50 },
      { key: "Misc_Add1", label: "Start Time", type: "text", required: false, placeholder: "e.g. 09.00",                maxLength: 50 },
      { key: "Misc_Add2", label: "End Time", type: "text", required: false, placeholder: "e.g. 17.00",                maxLength: 50 },
    ],
  },

  "91": {
    Misc_Type : 91,
    title     : "Region Master",
    fields    : [
      { key: "Misc_Name", label: "Region Name", type: "text", required: true,  placeholder: "e.g. North, South, East, West", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",  type: "text", required: false, placeholder: "e.g. N, S, E, W",               maxLength: 50 },
    ],
  },

  "92": {
    Misc_Type : 92,
    title     : "Mis Punch Master",
    fields    : [
      { key: "Misc_Name", label: "Punch Type",  type: "text", required: true,  placeholder: "e.g. Early In, Late Out", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",  type: "text", required: false, placeholder: "e.g. EI, LO",             maxLength: 50 },
      { key: "Misc_Dtl1", label: "Description", type: "text", required: false, placeholder: "Additional details",      maxLength: 50 },
    ],
  },

  "654": {
    Misc_Type : 654,
    title     : "PF Percentage Master",
    fields    : [
      { key: "Misc_Name", label: "PF Percentage",      type: "number",   required: true,  placeholder: "e.g. 12%", maxLength: 75 },
      ],
  },

  "657": {
    Misc_Type : 657,
    title     : "Marital Status",
    fields    : [
      { key: "Misc_Name", label: "Marital Status", type: "text", required: true,  placeholder: "e.g. Single, Married, Divorced", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",     type: "text", required: false, placeholder: "e.g. S, M, D",                   maxLength: 50 },
    ],
  },
 "1001": {
    Misc_Type : 1001,
    title     : "Mobile Rights",
    fields    : [
      { key: "Misc_Name", label: "Mobile Rights", type: "text", required: true,  placeholder: "e.g. 1.1.1", maxLength: 75 },
      { key: "Misc_HOD", label: "Module Code",     type: "text", required: false, placeholder: "e.g. 10",                   maxLength: 50 },
    ],
  },
    "1002": {
    Misc_Type : 1002,
    title     : "Default Shift Master",
    fields    : [
      { key: "Misc_Name", label: "Shift Name",   type: "text", required: true,  placeholder: "e.g. Morning Shift, Night Shift", maxLength: 75 },
      { key: "Misc_Abbr", label: "Short Code",   type: "text", required: false, placeholder: "e.g. MS, NS",                     maxLength: 50 },
      { key: "Misc_Add1", label: "Start Time", type: "text", required: false, placeholder: "e.g. 09.00",                maxLength: 50 },
      { key: "Misc_Add2", label: "End Time", type: "text", required: false, placeholder: "e.g. 17.00",                maxLength: 50 },
    ],
  },

  // ── Default fallback ──────────────────────────────────
  "default": {
    Misc_Type : 0,
    title     : "Create Record",
    fields    : [
      { key: "Misc_Name", label: "Name", type: "text", required: true, placeholder: "Enter name", maxLength: 75 },
    ],
  },
};

export const getFormConfig = (miscType: string): MiscFormConfig => {
  return MISC_FORM_CONFIGS[miscType] || {
    ...MISC_FORM_CONFIGS["default"],
    Misc_Type : parseInt(miscType),
    title     : `Create - Type ${miscType}`,
  };
};