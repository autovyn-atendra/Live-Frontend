"use client";
import { FormDataProvider } from "./branchconntext";

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FormDataProvider>{children}</FormDataProvider>;
}
