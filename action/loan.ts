"use server";

import axios from "axios";

//loan Request apis

export async function fetchAdvDeductionForUser(user: object) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/findUser/${user?.id}`,
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
export async function saveadvdeduction(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/save`,
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

//loan approver1data

export async function getLoanApproversData1(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/findAppr1Data`,
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

export async function handleloanApprove(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/updateData`,
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

export async function handleLoanAmountUpdate(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/updateSanctionAmount`,
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

export async function handleLoanReject(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/updateData`,
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

//approver2

export async function getLoanApproversData2(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/findAppr2Data`,
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
export async function getLoanApproversData3(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/findAppr3Data`,
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

export async function getFinalData(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/findFinApprData`,
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

export async function getAccountsdata(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/findHrDtlData`,
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

export async function UpdateDateofEmi(data, user) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/updateDate`,
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

export async function downloadExcelsheet(data, user) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/advDeduction/downloadAdvDeducReport`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Comp_Code: user?.Comp_Code,
        },
      }
    );
    if (response.status == 200) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Advance_Deduction.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error("Error downloading Excel file:", error);
  }
}
