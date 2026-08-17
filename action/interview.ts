"use server";

import axios from "axios";

export async function CandidateSave(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/newJoining/insertData`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.status; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching advanced deductions for user:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}

export async function TempleteSave(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/template/insertData`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.status; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching advanced deductions for user:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}

export async function FindTemplete(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/template/insertData`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data.data.Template; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching advanced deductions for user:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}
