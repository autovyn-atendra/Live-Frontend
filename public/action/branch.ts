"use server";

import axios from "axios";
import { logoutAction } from "./loginAction";
export async function fetchBranch(user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/branch/all`,
      {
        User_Code: user?.id,
      },
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching branches:", error);
    await logoutAction();
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}
export async function onlybranch(user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/branch/onlybranch`,
      user,
      {
        headers: {
          compcode: user?.Comp_Code,name:user?.name,
        },
      }
    );
    return response.data; // Assuming you want to return the data received from the API call
  } catch (error) {
    console.error("Error fetching branches:", error);
    return { error: "Unknown Error Found" }; // Return a meaningful error message
  }
}
