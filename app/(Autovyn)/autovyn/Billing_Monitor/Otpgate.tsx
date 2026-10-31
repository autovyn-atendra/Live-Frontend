"use client";
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { LuLock, LuRefreshCw, LuShieldCheck } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import Ainput from "@/components/atoms/Input";
import { Api } from "./utils";

const maskNo = (n: string) => `${n.slice(0, 2)}••••••${n.slice(-2)}`;

// Existing OTP flow (sendClientBillingOtp / verifyClientBillingOtp) jaisa tha waisa hi hai
const OtpGate = ({ api, enabled, onVerified }: { api: Api; enabled: boolean; onVerified: () => void }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState<string[]>([]);
  const requested = useRef(false);

  const sendOtp = async () => {
    try {
      setLoading(true);
      const res = await api("sendClientBillingOtp");
      if (res?.Status) {
        setOtp("");
        setNumbers((res.Numbers || []).map((n: any) => String(n)));
        Swal.fire({ icon: "success", title: "OTP Sent", text: "OTP has been sent to the authorized WhatsApp numbers.", timer: 1800, showConfirmButton: false });
      }
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "OTP Error", text: e?.response?.data?.Message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 4) return Swal.fire({ icon: "warning", title: "Invalid OTP", text: "Please enter 4 digit OTP." });
    try {
      setLoading(true);
      const res = await api("verifyClientBillingOtp", { otp });
      if (res?.Status) {
        Swal.fire({ icon: "success", title: "Verified", text: "Billing Monitor access granted.", timer: 1500, showConfirmButton: false });
        onVerified();
      }
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Invalid OTP", text: e?.response?.data?.Message || "Invalid OTP" });
    } finally {
      setLoading(false);
    }
  };

  // page khulte hi ek baar OTP bhejo
  useEffect(() => {
    if (enabled && !requested.current) {
      requested.current = true;
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-lg shadow-lg overflow-hidden">
        <div className="bg-header px-5 py-4">
          <h1 className="text-white font-bold text-xl uppercase flex items-center gap-2"><LuLock size={22} />Master Security Verification</h1>
          <p className="text-white/80 text-sm mt-1">Billing Monitor</p>
        </div>
        <div className="p-6">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-[#EEF2FF] flex items-center justify-center"><LuShieldCheck size={42} className="text-[#4F46E5]" /></div>
          </div>
          <h2 className="text-center font-bold text-xl text-[#1E293B] dark:text-white">OTP Verification</h2>
          <p className="text-center text-sm text-[#64748B] dark:text-[#94A3B8] mt-2">
            OTP has been sent to the authorized WhatsApp numbers.<br /><b>{numbers.map(maskNo).join(", ")}</b>
          </p>
          <div className="mt-5">
            <Ainput title="Enter OTP" name="otp" type="text" value={otp} maxLength={4}
              handleInputChange={(_n: any, v: any) => { if (/^\d{0,4}$/.test(v)) setOtp(v); }} />
          </div>
          <div className="flex gap-2 mt-5">
            <Button variant="save" className="flex-1" onClick={verifyOtp} disabled={loading}>Verify OTP</Button>
            <button
  type="button"
  onClick={sendOtp}
  disabled={loading}
  title="Resend OTP"
  className="flex items-center gap-2 rounded-md border border-[#D1D5DB] bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50"
>
  <LuRefreshCw className={loading ? "animate-spin" : ""} />
  Resend OTP
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpGate;