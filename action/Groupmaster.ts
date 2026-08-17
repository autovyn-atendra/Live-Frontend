"use server";

import axios from "axios";

export async function FetchGroupTable(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/groupMaster/FindGroup`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data.data.GrupMst; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching branches:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}
export async function FetchGroupName(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/groupMaster/FindGroupName`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data.data.data; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching branches:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}
export async function InsertNewGroup(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/groupMaster/insertData`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.status; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching branches:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}

export async function UpdateNewGroup(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/groupMaster/updateGroup`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.status;
  } catch (error) {
    console.error("Error fetching branches:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}
