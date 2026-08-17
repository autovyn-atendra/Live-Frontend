"use client";

import AButton from "./atoms/Buttton";
import SelectSearch from "./atoms/Select";
import React, { useEffect, useState } from "react";

const LetterCreator = () => {
  const [templateName, setTemplateName] = useState("");
  const [letterContent, setLetterContent] = useState("");
  const [placeholders, setPlaceholders] = useState("");
  const [generatedLetter, setGeneratedLetter] = useState("");

  useEffect(() => {
    generateLetter();
  }, [letterContent, placeholders]);

  const generateLetter = () => {
    // Replace placeholders with user input
    setGeneratedLetter(letterContent);
    let content = letterContent;
    const placeholderArray = placeholders.split(",,");
    placeholderArray.forEach((placeholder) => {
      const [key, value] = placeholder.split(":");
      if (key && value) {
        const regex = new RegExp(key, "g");
        content = content.replace(regex, value.trim());
      }
    });
    setGeneratedLetter(content);
  };

  const showalll = () => {
    console.log(templateName);
    console.log(letterContent);
    console.log(placeholders);
  };
  const handlePrint = () => {
    window.print();
  };
  const handleSelectChange = async (selectedOption) => {
    console.log(selectedOption.value);
  };
  const options = [
    { label: "Birthday Templete", value: "Birthday" },
    { label: "Anniversry ", value: "Anniversry" },
    { label: "Joinng Letter", value: "Joinng Letter" },
    // Add more options as needed
  ];

  return (
    <main className="grid grid-cols-12 w-full">
      <div className="col-span-12 xl:col-span-6">
        <div className="p-2">
          <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 w-full ">
            <div className="flex flex-col sm:flex-row items-center justify-between py-1">
              <h1 className="block uppercase text-xs sm:text-sm md:text-lg lg:text-xl font-bold mb-2 sm:mb-0">
                Templete Creator
              </h1>
              <div className="flex flex-wrap">
                <AButton
                  color="primary"
                  text="Save"
                  type="submit"
                  onClick={showalll}
                />
                <AButton type="submit" text="Update" color="save" />
              </div>
            </div>
          </div>
          <div className="col-span-12 dark:bg-primary dark:bg-opacity-10 ">
            <div className="w-full shadow rounded-lg">
              <form className="p-4">
                <div className="flex gap-2 justify-between w-full">
                  <div className="mb-4 uppercase w-1/2">
                    <label
                      htmlFor="templateName"
                      className="block uppercase  text-xs font-bold mb-1"
                    >
                      Template Name:
                    </label>
                    <input
                      type="text"
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="border-0 px-1.5 py-1.5 dark:bg-input  rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    />
                  </div>
                  <div className="mb-4 uppercase w-1/2">
                    <SelectSearch
                      onChange={handleSelectChange}
                      options={options}
                      name={"templete"}
                      title={"existing Templetes"}
                    />
                  </div>
                </div>
                <div className="mb-4 uppercase">
                  <label
                    htmlFor="letterContent"
                    className="block uppercase  text-xs font-bold mb-1"
                  >
                    Letter Content:
                  </label>
                  <textarea
                    rows={14}
                    id="letterContent"
                    value={letterContent}
                    onChange={(e) => {
                      setLetterContent(e.target.value);
                    }}
                    className="border-0 px-1.5 py-1.5 dark:bg-input  rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  />
                </div>
                <div className="mb-4 uppercase">
                  <label
                    htmlFor="placeholders"
                    className="block uppercase  text-xs font-bold mb-1"
                  >
                    Example (Title:Mr/Mrs, Name:Himanshu, ...):
                  </label>
                  <textarea
                    rows={3}
                    id="letterContent"
                    value={placeholders}
                    onChange={(e) => {
                      setPlaceholders(e.target.value);
                    }}
                    className="border-0 px-1.5 py-1.5 dark:bg-input  rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-6">
        <div className="p-2">
          <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 w-full ">
            <div className="flex flex-col sm:flex-row items-center justify-between py-1">
              <h1 className="block uppercase text-xs sm:text-sm md:text-lg lg:text-xl font-bold mb-2 sm:mb-0">
                Generated Letter
              </h1>
              <div className="flex flex-wrap">
                <AButton
                  type="button"
                  onClick={handlePrint}
                  text="Print"
                  color="exit"
                />
              </div>
            </div>
          </div>
          <div className="col-span-12 dark:bg-primary dark:bg-opacity-10 ">
            <div className="w-full shadow rounded-lg p-2 h-[548px]">
              <pre
                className="bg-white dark:bg-dark"
                style={{
                  borderRadius: "5px",
                  padding: "10px",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  border: "1px solid #ddd",
                }}
              >
                {generatedLetter}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LetterCreator;
