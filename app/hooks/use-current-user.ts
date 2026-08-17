import { useSession } from "next-auth/react";

export const useCurrentUser = () => {
  const { data, status } = useSession();
  if (status !== "authenticated") return null;
  return data?.user;
};