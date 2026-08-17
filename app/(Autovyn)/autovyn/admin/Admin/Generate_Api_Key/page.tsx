"use client";
import { useEffect, useState, useCallback } from "react"; //correct
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import SelectSearch from "@/components/atoms/Select";
import Acheckbox from "@/components/atoms/Checkbox";
import Ainput from "@/components/atoms/Input";
import ReportsRights from "@/components/Templates/ReportsRights";
import Swal from "sweetalert2";
import axios from "axios";
import Eselect from "@/components/atoms/Eselect";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { FaUsers } from "react-icons/fa";
import { GrUserAdmin } from "react-icons/gr";




const Page = () => {
  const user = useCurrentUser();
  const [generatedOtp, setGeneratedOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Using filters for all inputs
  const [filters, setFilters] = useState({
    inputText: "",
    otp: "",
    encryptedText:"",
  });

  const handleInputChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const SendOtp = async () => {
    if (!filters.inputText.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Input Required",
          text: "Please enter the CompCode before generating OTP.",
        });
        return;
      }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/rtoapi/sendOtp`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code || "",
          },
        }
      );

      setGeneratedOtp(true);
      setFilters((prev) => ({ ...prev, otp: "" })); // Clear OTP field

      Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: "OTP has been sent successfully.",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to send OTP. Please try again later.",
      });
    }
  };

  const VerifyOtp = async () => {
  
    if (!filters.otp) {
      Swal.fire("Error", "OTP is required!", "error");
      return;
    }
  
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/RtoApi/verifyOtp`,
        { mobileNumber: "9461281038", otp: filters.otp },
        {
          headers: {
            compcode: user?.Comp_Code || "",
          },
        }
      );
  
  
      if (response.data.Status=== true) {
        Swal.fire("Success", "OTP Verified Successfully!", "success");
        
  
        localStorage.setItem("authToken", response.data.Token);
        setIsVerified(true);
  
       
        
          await encryptInputText(filters.inputText);
       
      } else {
        Swal.fire("Error", "OTP Verification Failed", "error");
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.Message || "Failed to verify OTP", "error");
    }
  };
  

  const encryptInputText = async (inputText) => {
    try {
      const receivedToken = localStorage.getItem('authToken'); 
  console.log(receivedToken,'receivedToken')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/rtoapi/GenerateApiKey`,
        { compcode: inputText }, 
        {
          headers: {
            Authorization: `${receivedToken}`,
            compcode: user?.Comp_Code || "", 
          }
        }
      );
  
      // Update the state with the encrypted text
      setFilters((prev) => ({
        ...prev,
        encryptedText: response.data.apiKey, // Ensure you access the correct key from API response
      }));
    } catch (error) {
          console.error('Authentication failed. Please log in again.');
  };
}
  
  

return (
  <main className="grid grid-cols-12 w-full gap-2">
    <div className="col-span-12 xl:col-span-5 md:col-span-12">
      <div className="justify-center p-1 shadow dark:bg-primary dark:bg-opacity-10 rounded-lg">
        <div className="rounded-t bg-white dark:bg-dark mb-0 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between py-1">
            <div className="col-span-6 md:col-span-6 md:gap-2">
              <div className="flex flex-col sm:flex-row items-center justify-between py-1">
                <GrUserAdmin size={34} title="Payroll" />
              </div>
            </div>
            <div className="col-span-6 md:col-span-6 md:gap-2">
              <div className="flex flex-col sm:flex-row items-center justify-between py-1">
                <Button variant={"print"} onClick={() => window.history.back()}>
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2 p-3">
          <div className="lg:col-span-6 md:col-span-12 col-span-12">
            <Ainput
              title="CompCode"
              type="text"
              name="inputText"
              handleInputChange={handleInputChange}
              value={filters.inputText}
            />
          </div>
          <Button
            className="lg:col-span-6 md:col-span-12 col-span-12 mt-6"
            variant={"save"}
            onClick={SendOtp}
          >
            Generate OTP
          </Button>

          {generatedOtp && (
            <>
              <div className="lg:col-span-6 md:col-span-12 col-span-12">
                <Ainput
               title="Enter OTP"
               type="number"
               name="otp"
               handleInputChange={handleInputChange}
               value={filters.otp}
                />
              </div>
              <Button
                className="lg:col-span-6 md:col-span-12 col-span-12 mt-6"
                variant={"save"}
                onClick={VerifyOtp}
              >
                Verify OTP
              </Button>
            </>
          )}

          {isVerified && (
            <div className="lg:col-span-12 md:col-span-12 col-span-12">
              <Ainput
               title="Encrypted Text"
               type="text"
               name="encryptedText"
               value={filters.encryptedText}
               disabled
              />
            </div>
          )}

          <div className="py-8"></div>
        </div>
      </div>
    </div>
  </main>
);

};

export default Page;