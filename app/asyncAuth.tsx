"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthSync({ children }: any) {
  const router = useRouter();

  useEffect(() => {
    const syncLogout = (event: StorageEvent) => {
      if (event.key == "logout") {
        router.push("/");
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => {
      window.removeEventListener("storage", syncLogout);
    };
  }, []);

  return children;
}