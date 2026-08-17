import React from "react";

const StatusBar = ({ steps, currentStep, showLabel }) => {
  return (
    <div className="w-full mx-auto flex items-center justify-center ml-16">
      {steps.map((step, index) => (
        <div key={index} className="relative flex items-center w-full">
          {/* Step Label */}
          {showLabel && (
            <div className="absolute uppercase top-[-1.5rem] left-4  transform -translate-x-1/2 text-xs sm:text-sm font-medium transition-colors duration-500 whitespace-nowrap text-ellipsis">
              <span className={index < currentStep ? "text-green" : index === currentStep ? "text-yellow" : "text-black dark:text-white"}>
                {step.label}
              </span>
            </div>
          )}
          <div
            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-white font-bold transition-colors duration-500
              ${index < currentStep ? "bg-green" : index === currentStep ? "bg-yellow" : "bg-grey"}`}
          >
            {index + 1}
          </div>

          {index < steps.length - 1 && (
            <div className="relative flex-grow h-1 bg-grey mx-2 sm:mx-4">
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-500 ease-in-out ${index < currentStep ? "bg-green" : "bg-grey"
                  }`}
                style={{ width: index < currentStep ? "100%" : "0%" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatusBar;
