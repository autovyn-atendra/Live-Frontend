"use server";
import { signIn, signOut } from "@/app/auth";
import { AuthError } from "next-auth";
export async function loginAction(formData) {
  try {
    const { username, password, comp_code, year } = formData;
    console.log(formData, "formdata");
    console.log(formData);
    await signIn("credentials", {
      username: username,
      password: password,
      Comp_Code: comp_code,
      Year: year,
      redirectTo: "/branch",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials" };
        default:
          return { error: "Unknown Error Found" };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  try {
    await signOut();
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials" };
        default:
          return { error: "Unknown Error Found" };
      }
    }
    throw error;
  }
}

export async function ChangePassword(formData) {
  try {
    console.log(formData, "formdata");
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials" };
        default:
          return { error: "Unknown Error Found" };
      }
    }
    throw error;
  }
}
