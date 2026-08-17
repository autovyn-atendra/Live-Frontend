'use client';
import { FormDataProvider } from './Context/FormDataContext';

export default function EmplMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FormDataProvider>{children}</FormDataProvider>;
}
