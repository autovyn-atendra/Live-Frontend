// components/PageHistoryTracker.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";


export default function PageHistoryTracker() {
  const pathname = usePathname();
  const user = useCurrentUser();

  const startTimeRef = useRef<number>(Date.now());
  const previousPathnameRef = useRef<string | null>(pathname);

  /** ------------------------------------------------------------------
   * SAVE PAGE HISTORY API CALL
   * ------------------------------------------------------------------ */
  const saveHistory = async (
    pageName: string,
    userData: any,
    durationInSeconds: number
  ) => {
    console.log(userData, "userData")
    // EMPCODE:0 and id :4 ,
    console.log(pageName, "pagename")
    if (
      !userData ||
      userData.id == null ||
      userData.EMPCODE == null ||
      !pageName
    ) {
      console.warn("Skipping saveHistory → Missing user or pageName");
      return;
    }

    console.log(
      `Saving history → Page: "${pageName}", Time: ${durationInSeconds}s`
    );

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_URL}/users/InsertUserActHst`;

      const payload = {
        USER_Code: userData.id,
        Action_Taken: `Viewed page: ${pageName} for ${durationInSeconds}s`,
        Loc_Code: userData.branch || 0,
        Src_Portal: "1",
        Emp_Code: userData.EMPCODE,
      };

      console.log("Payload →", payload);

      await axios.post(apiUrl, payload, {
        headers: {
          compcode: userData.Comp_Code,
        },
      });

      console.log(`History saved successfully for ${pageName}`);
    } catch (error) {
      console.error("Failed to save page history:", error);
    }
  };

  /** ------------------------------------------------------------------
   * TRACK ALL BUTTON CLICKS
   * ------------------------------------------------------------------ */
  // useEffect(() => {
  //   const handleGlobalClick = async (event: MouseEvent) => {
  //     const button = (event.target as HTMLElement).closest("button");
  //     if (button) {
  //       const buttonName =
  //         button.textContent?.trim() ||
  //         button.getAttribute("aria-label") ||
  //         button.getAttribute("name") ||
  //         button.id ||
  //         "Unnamed Button";

  //       console.log(`Button Click → "${buttonName}" | Page → "${pathname}"`);

  //       const apiUrl = `${process.env.NEXT_PUBLIC_URL}/users/InsertUserActHst`;

  //       const payload = {
  //         USER_Code: user?.id,
  //         Action_Taken: `Button Click → "${buttonName}" | Page → "${pathname}"`,
  //         Loc_Code: user.branch || 0,
  //         Src_Portal: "1",
  //         Action_LMode: 1,
  //         Emp_Code: user.EMPCODE,
  //       };

  //       console.log("Payload →", payload);

  //       await axios.post(apiUrl, payload, {
  //         headers: {
  //           compcode: userData.Comp_Code,
  //         },
  //       });
  //     }
  //   };

  //   document.addEventListener("click", handleGlobalClick);
  //   return () => document.removeEventListener("click", handleGlobalClick);
  // }, [pathname]);



  useEffect(() => {
    const handleGlobalClick = async (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest("button");
      if (!button || !user) return;

      // Extract button name
      const buttonName =
        button.textContent?.trim() ||
        button.getAttribute("aria-label") ||
        button.getAttribute("name") ||
        button.id ||
        "Unnamed Button";

      console.log(`Button Click → "${buttonName}" | Page → "${pathname}"`);



      const payload = {
        USER_Code: user.id,
        Action_Taken: `Button Click → "${buttonName}" | Page → "${pathname}"`,
        Loc_Code: user?.branch || 0,
        Src_Portal: "1",
        Emp_Code: user.EMPCODE,
      };

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/InsertUserActHst`,
          payload,
          {
            headers: { compcode: user.Comp_Code }, // FIXED HERE
          }
        );

        console.log("Button Click Saved:", payload);
      } catch (error) {
        console.error("Failed to save button click:", error);
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [pathname, user]); // USER ADDED HERE





  /** ------------------------------------------------------------------
   * TRACK PAGE CHANGE AND TIME SPENT
   * ------------------------------------------------------------------ */
  // useEffect(() => {
  //   if (previousPathnameRef.current && user) {
  //     const end = Date.now();
  //     const duration = Math.round((end - startTimeRef.current) / 1000);

  //     saveHistory(previousPathnameRef.current, user, duration);
  //   }

  //   startTimeRef.current = Date.now();
  //   previousPathnameRef.current = pathname;

  //   return () => {
  //     if (previousPathnameRef.current && user) {
  //       const duration = Math.round(
  //         (Date.now() - startTimeRef.current) / 1000
  //       );
  //       saveHistory(previousPathnameRef.current, user, duration);
  //     }
  //   };
  // }, [pathname, user]);

  //   return null;
  // }

  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    if (previousPathnameRef.current && !hasSavedRef.current) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      saveHistory(previousPathnameRef.current, user, duration);
      hasSavedRef.current = true; // prevent double-call
    }

    // reset when pathname changes
    startTimeRef.current = Date.now();
    previousPathnameRef.current = pathname;
    hasSavedRef.current = false;

    return () => {
      if (!hasSavedRef.current && previousPathnameRef.current) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        saveHistory(previousPathnameRef.current, user, duration);
        hasSavedRef.current = true;
      }
    };
  }, [pathname, user]);

  return null;
}