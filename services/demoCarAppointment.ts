// // services/demoCarAppointment.ts

// import axios from "axios";

// const BASE_URL = process.env.NEXT_PUBLIC_URL ;
// const HEADERS = {
//   accept: "application/json",
//   compcode: "autovyn",
//   name: "admin",
//   "Content-Type": "application/json",
// };

// // Masters API (Branch + ModelGroup)
// export const getMasters = async () => {
//   const res = await axios.post(
//     `${BASE_URL}/fuel/Masters`,
//     {},
//     { headers: HEADERS }
//   );
//   return res.data;
// };

// // Model Details (Model_Group se Models)
// export const getModelDetails = async (ModelGroup: number) => {
//   const res = await axios.post(
//     `${BASE_URL}/fuel/ModelDetails`,
//     { ModelGroup },
//     { headers: HEADERS }
//   );
//   return res.data;
// };

// // Demo Car Models + Driver
// export const getDemoCarMasters = async (branch: string) => {
//   const res = await axios.post(
//     `${BASE_URL}/DemoCar/modelnamefetch`,
//     { branch },
//     { headers: HEADERS }
//   );
//   return res.data;
// };

// // Create Appointment
// export const createAppointment = async (payload: any) => {
//   const res = await axios.post(
//     // `${BASE_URL}/demo-car-appointment/create`,
//     "localhost:5000/demo-car-appointment/create",
//     payload,
//     { headers: HEADERS }
//   );
//   return res.data;
// };

// // Get All Appointments
// export const getAllAppointments = async (filters: any) => {
//   const res = await axios.get(
//     // `${BASE_URL}/demo-car-appointment/getAll`,
//     "localhost:5000/demo-car-appointment/getAll",
//     {
//       headers: HEADERS,
//       params: filters,
//     }
//   );
//   return res.data;
// };

// // Update Appointment
// export const updateAppointment = async (payload: any) => {
//   const res = await axios.patch(
//     `${BASE_URL}/demo-car-appointment/update`,
//     payload,
//     { headers: HEADERS }
//   );
//   return res.data;
// };


import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
  // const user = useCurrentUser();

const BASE_URL = process.env.NEXT_PUBLIC_URL;
const HEADERS = {
  accept: "application/json",
  compcode:"autovyn",
  name: "admin",
  "Content-Type": "application/json",
};

export const getMasters = async () => {
  const res = await axios.post(
    `${BASE_URL}/fuel/Masters`,
    {},
    { headers: HEADERS }
  );
  return res.data;
};

export const getModelDetails = async (ModelGroup: number) => {
  const res = await axios.post(
    `${BASE_URL}/fuel/ModelDetails`,
    { ModelGroup },
    { headers: HEADERS }
  );
  return res.data;
};

export const getDemoCarMasters = async (branch: string) => {
  const res = await axios.post(
    `${BASE_URL}/DemoCar/modelnamefetch`,
    { branch },
    { headers: HEADERS }
  );
  return res.data;
};

// ✅ BASE_URL fixed
export const createAppointment = async (payload: any) => {
  const res = await axios.post(
    `http://localhost:5000/demo-car-appointment/create`,
    payload,
    { headers: HEADERS }
  );
  return res.data;
};

// ✅ POST + BASE_URL fixed
export const getAllAppointments = async (payload: any) => {
  const res = await axios.post(
    `http://localhost:5000/demo-car-appointment/getAll`,
    payload,
    { headers: HEADERS }
  );
  return res.data;
};

// ✅ Update
export const updateAppointment = async (payload: any) => {
  const res = await axios.put(
    `http://localhost:5000/demo-car-appointment/update`,
    payload,
    { headers: HEADERS }
  );
  return res.data;
};