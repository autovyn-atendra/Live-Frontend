"use server";

import axios from "axios";

export async function FindMaster(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/Master/FindMaster`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error in getting loan approvers data:", error);
    throw error; // Re-throw the error to be caught by the caller or handle it appropriately
  }
}
export async function UpdateMaster(data, UTD, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/Master/updateMaster/${UTD}`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.status; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error in getting loan approvers data:", error);
    throw error; // Re-throw the error to be caught by the caller or handle it appropriately
  }
}

export async function AddMaster(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/Master/insertData`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.status; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error in getting loan approvers data:", error);
    throw error; // Re-throw the error to be caught by the caller or handle it appropriately
  }
}


export async function AddMaster1(data, user) {
  try {
    console.log("shsh")
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/Master/insertData1`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.status; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error in getting loan approvers data:", error);
    throw error; // Re-throw the error to be caught by the caller or handle it appropriately
  }
}

export async function AddUserActionHst(data, user) {
  try {
    console.log("RunhistoryApi");

    // Validate required inputs
    if (!data) {
      console.warn("⚠ No 'data' provided to AddUserActionHst");
      return null;
    }

    if (!user || !user.Comp_Code) {
      console.warn("⚠ No valid 'user' provided to AddUserActionHst");
      return null;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/users/InsertUserActHst`,
      data,
      {
        headers: {
          compcode: user.Comp_Code,
          name: user?.name || "",
        },
      }
    );

    return response.data; // Return full response from backend

  } catch (error) {
    console.error("🔥 Error in AddUserActionHst:", error?.response?.data || error.message);
    return null;  // Prevent crash
  }
}
