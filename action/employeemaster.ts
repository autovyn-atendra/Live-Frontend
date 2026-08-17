"use server";

import axios from "axios";

export async function EmpcodeGenerate(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/empded`,
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
