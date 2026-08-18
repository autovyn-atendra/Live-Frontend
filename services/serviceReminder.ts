import axios from "axios";

const BASE_URL =
//   process.env.NEXT_PUBLIC_URL ||
  "http://localhost:5000";

const getJsonHeaders = () => ({
  accept: "application/json",
  compcode: "autovyn",
  name: "admin",
  "Content-Type": "application/json",
});

const getMultipartHeaders = (
  compcode?: string,
  name?: string
) => ({
  accept: "application/json",
  compcode: compcode || "autovyn",
  name: name || "admin",
});

// ============================================================
// TYPES
// ============================================================

export type ImportCustomerVehicleParams = {
  file: File;
  user?: string | number;
  Loc_Code?: string;
  compcode?: string;
  name?: string;
};

export type CustomerVehiclePayload = {
  UTD?: number;
  Loc_Code: string;
  Veh_Reg_No: string;
  Cust_Name: string;
  Cust_Mob: string;
  Model_Name: string;
  Last_Service_Date?: string | null;
  Last_Service_KM?: number | null;
  Avg_Daily_KM?: number | null;
  Current_KM?: number | null;
  status?: number;
  Created_By?: string | number | null;
  Updated_By?: string | number | null;
};

// ============================================================
// IMPORT CUSTOMER VEHICLES
// ============================================================

export const importCustomerVehicles = async ({
  file,
  user,
  Loc_Code,
  compcode,
  name,
}: ImportCustomerVehicleParams) => {
  const formData = new FormData();

  formData.append(
    "excel",
    file,
    file.name
  );

  if (
    user !== undefined &&
    user !== null &&
    user !== ""
  ) {
    formData.append(
      "user",
      String(user)
    );
  }

  if (Loc_Code) {
    formData.append(
      "Loc_Code",
      String(Loc_Code)
    );
  }

  const response = await axios.post(
    `${BASE_URL}/service-reminder/customer-vehicle/import`,
    formData,
    {
      headers: getMultipartHeaders(
        compcode,
        name
      ),
    }
  );

  return response.data;
};

// ============================================================
// CUSTOMER VEHICLE CRUD
// ============================================================

export const createCustomerVehicle = async (
  payload: CustomerVehiclePayload
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/customer-vehicle/create`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const getAllCustomerVehicles = async (
  payload: {
    page?: number;
    pageSize?: number;
    search?: string;
    Loc_Code?: string;
    Model_Name?: string;
    status?: string | number;
    emp_code?: string;
    emp_dms_code?: string;
    user_code?: string | number;
  }
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/customer-vehicle/getAll`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const getOneCustomerVehicle = async (
  UTD: number
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/customer-vehicle/getOne`,
    { UTD },
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const updateCustomerVehicle = async (
  payload: Partial<CustomerVehiclePayload> & {
    UTD: number;
  }
) => {
  const response = await axios.put(
    `${BASE_URL}/service-reminder/customer-vehicle/update`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

// ============================================================
// SERVICE RULES
// ============================================================

export const createServiceRule = async (
  payload: any
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/service-rule/create`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const getAllServiceRules = async (
  payload: any
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/service-rule/getAll`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const getOneServiceRule = async (
  UTD: number
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/service-rule/getOne`,
    { UTD },
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const updateServiceRule = async (
  payload: any
) => {
  const response = await axios.put(
    `${BASE_URL}/service-reminder/service-rule/update`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

// ============================================================
// REMINDERS
// ============================================================

export const generateReminder = async (
  payload: {
    Cust_Vehi_UTD: number;
    Reminder_Channel?: string;
  }
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/reminder/generate`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const getAllReminders = async (
  payload: any
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/reminder/getAll`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const getOneReminder = async (
  UTD: number
) => {
  const response = await axios.post(
    `${BASE_URL}/service-reminder/reminder/getOne`,
    { UTD },
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const updateReminder = async (
  payload: any
) => {
  const response = await axios.put(
    `${BASE_URL}/service-reminder/reminder/update`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};

export const completeService = async (
  payload: any
) => {
  const response = await axios.put(
    `${BASE_URL}/service-reminder/reminder/complete-service`,
    payload,
    {
      headers: getJsonHeaders(),
    }
  );

  return response.data;
};