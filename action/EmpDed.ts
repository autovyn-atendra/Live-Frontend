"use server";

import axios from "axios";

export async function findAll(user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/empded/findAll`,
      {
        Created_by: user?.name,
      },
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching advanced deductions for user:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}
export async function HandleUpdateEMPloyeded(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/empded/update`,
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

export async function HandleSaveEMPloyeded(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/empded/insertData`,
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

export async function FindMasters(user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/empded/findMasters`,
      {  branch: user?.branch, },
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data; 
  } catch (error) {
    console.error("Error fetching Master Data", error);
    return { error: "Error fetching Master Data" }; 
  }
}
