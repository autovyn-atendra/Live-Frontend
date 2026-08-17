// import { type ClassValue, clsx } from "clsx";
// import { useEffect, useState } from "react";
// import { twMerge } from "tailwind-merge";

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// export function useLocalStorage(key: string) {
//   const [value, setValue] = useState(() => {
//     return JSON.parse(localStorage.getItem(key)!);
//   });
//   useEffect(() => {
//     localStorage.setItem(key, JSON.stringify(value));
//   }, [value, key]);
//   return [value, setValue];
// }
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}