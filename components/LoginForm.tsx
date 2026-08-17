"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { loginAction } from "../action/loginAction";

export default function Index() {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm();

  const [errormsg, setErrorMsg] = useState(null);
  const onSubmit = async (data) => {
    const res = await loginAction(data);
    console.log(res, "error");
    setErrorMsg(res?.error);
  };

  return (
    <div className="min-h-screen  py-6 flex flex-col justify-center sm:py-12  ">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-b300 to-b600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-opacity-100 bg-off dark:bg-dark dark:bg-opacity-100 shadow-lg sm:rounded-3xl sm:p-20">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="max-w-md mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">
                  Welcome To Autovyn Cloud
                </h1>
              </div>

              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <div className="relative">
                    <label
                      className="block uppercase  text-xs font-bold mb-1"
                      htmlFor="name"
                    >
                      Select Financial Year
                    </label>
                    <select
                      className="border-0 px-1.5 py-1.5 dark:bg-input  rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      name="name"
                      placeholder=""
                    >
                      <option value="2020">Financial Year 2020 2021</option>
                      <option value="2020">Financial Year 2021 2022</option>
                      <option value="2020">Financial Year 2022 2023</option>
                    </select>
                  </div>

                  <div className="w-full px-1">
                    <fieldset>
                      <label
                        className="block uppercase  text-xs font-bold mb-1"
                        htmlFor="Username"
                      >
                        UserName
                      </label>
                      <input
                        type="text"
                        className="border-0 px-1.5 py-1.5 dark:bg-input  rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        {...register("username", { required: true })}
                      />
                      {errors.username?.type == "required" && (
                        <p className="text-xs uppercase font-bold mb-1 text-exit">
                          UserName Required
                        </p>
                      )}
                    </fieldset>
                  </div>
                  <div className="w-full  px-1">
                    <fieldset>
                      <label
                        className="block uppercase  text-xs font-bold mb-1"
                        htmlFor="Password"
                      >
                        UserName
                      </label>
                      <input
                        className="border-0 px-1.5 py-1.5 dark:bg-input  rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        type="text"
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
                  <div className="relative text-center">
                    <fieldset>
                      <button
                        className={`uppercase mx-2 font-bold text-lg rounded-lg text-white bg-primary px-6 py-1 transition-transform transform hover:-rotate-1 hover:scale-105`}
                        type="submit"
                      >
                        Submit
                      </button>
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
