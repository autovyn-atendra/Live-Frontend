 "use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ChangePassword } from "@/action/loginAction";
import Image from "next/image";
import { useCurrentUser } from "../hooks/use-current-user";
import Swal from "sweetalert2";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";


export default function Index() {
  const user = useCurrentUser();
  const router = useRouter()
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm();

  const [errormsg, setErrorMsg] = useState(null);
  const onSubmit = async (data) => {
    const formdata = {
      ...data,
      username: user?.id
    }
    if (data.confirmpassword !== data.newpassword) {
      Swal.fire({
        icon: "warning",
        title: "New Password and Confirm Password Is not Matched",
      })
      return;
    }
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/passwordChange`,
        formdata,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          }
        }
      )
      Swal.fire({
        icon: "success",
        title: "Password Change Successfully",
      }).then(function () {
        router.push('/autovyn')
      })
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: `${err.response?.data?.Message}`,
      })
      console.log(err)

    }

  };

  return (
    <div className="min-h-screen py-4 flex flex-col justify-center sm:py-12 bg-[#193A69] md:bg-[#F3F8FC] dark:bg-[#1E293B]">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#193A69] clip-diagonal dark:bg-[#0F172A]"></div>
      </div>
      <div className="fixed inset-0 bg-[#000000]/30 z-0"></div>


      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-opacity-100 bg-[#193A69] dark:bg-[#0F172A] bor shadow-lg sm:rounded-3xl sm:p-20 dark:border-[#38BDF8] border border-[#F3F8FC]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="max-w-md mx-auto">
              <div className="flex items-center">
                <h1 className="text-2xl md:text-2xl font-semibold uppercase flex text-white text-center md:text-left dark:text-[#38BDF8]  ">
                  Change Your Password
                </h1>
              </div>

              <div className="divide-y divide-gray-200">
                <div className="py-8 pb-0 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <div className="w-full px-1">
                    <fieldset>
                      <label
                        className="block uppercase  text-base font-semibold mb-1 text-[#F3F8FC] dark:text-[#38BDF8]"
                        htmlFor="Password"
                      >
                        current Password
                      </label>
                      <input
                        className="border-0 px-1.5 py-1.5 dark:bg-[#334155] text-[#686262] dark:text-[#9FA9BE]  rounded text-base font-semibold shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        type="password"
                        {...register("password", { required: true })}
                      />
                      {errors.password?.type == "required" && (
                        <p className="text-xs uppercase font-bold mb-1 text-exit">
                          Password Required
                        </p>
                      )}
                    </fieldset>
                  </div>
                  {errormsg && (
                    <div className="text-md uppercase text-center font-bold mb-1 text-exit">
                      {errormsg}
                    </div>
                  )}
                  <div className="w-full  px-1">
                    <fieldset>
                      <label
                        className="block uppercase  text-base font-semibold mb-1 text-[#F3F8FC] dark:text-[#B5B5B5s] dark:text-[#38BDF8]"
                        htmlFor="newpassword"
                      >
                        New Password
                      </label>
                      <input
                        className="border-0 px-1.5 py-1.5 dark:bg-[#334155] dark:text-[#9FA9BE] text-[#686262]  rounded text-base font-semibold shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        type="password"
                        {...register("newpassword", { required: true })}
                      />
                      {errors.newpassword?.type == "required" && (
                        <p className="text-xs uppercase font-bold mb-1 text-exit">
                          New Password Required
                        </p>
                      )}
                    </fieldset>
                  </div>
                  {errormsg && (
                    <div className="text-md uppercase text-center font-bold mb-1 text-exit">
                      {errormsg}
                    </div>
                  )}
                  <div className="w-full  px-1">
                    <fieldset>
                      <label
                        className="block uppercase  text-base font-semibold mb-1 text-[#F3F8FC] dark:text-[#38BDF8]"
                        htmlFor="confirmpassword"
                      >
                        Confirm New Password
                      </label>
                      <input
                        className="border-0 px-1.5 py-1.5 dark:bg-[#334155] dark:text-[#9FA9BE] text-[#686262]  rounded text-base font-semibold shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        type="password"
                        {...register("confirmpassword", { required: true })}
                      />
                      {errors.newpassword?.type == "required" && (
                        <p className="text-xs uppercase font-bold mb-1 text-exit">
                          Confirm  New Password Required
                        </p>
                      )}
                    </fieldset>
                  </div>
                  {errormsg && (
                    <div className="text-md uppercase text-center font-bold mb-1 text-exit">
                      {errormsg}
                    </div>
                  )}
                  <div className="relative text-center">
                    <fieldset>
                      <button
                        className="w-full mt-4 dark:bg-[#0F172A] text-white  dark:text-[#38BDF8] dark:border-[#38BDF8]  hover:bg-gray-100 border border-[#F3F8FC] font-bold py-1 px-2 rounded transition-colors duration-200 transform hover:scale-105 shadow"
                        type="submit"
                      >
                        Submit
                      </button>
                    </fieldset>
                     <Button className="mt-2 w-full" variant={"print"} onClick={() =>window?.history.back()}>
                      back
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* CSS for Diagonal Clip */}
      <style jsx>{`
         .clip-diagonal {
           clip-path: polygon(55% 0, 100% 0, 100% 100%, 45% 100%);
         }
       `}</style>
    </div>
  );
}

