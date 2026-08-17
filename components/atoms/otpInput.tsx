import React, { useState } from "react";
import { MuiOtpInput } from "mui-one-time-password-input";

const OtpInput = ({ autoFocus, handleInputChange,value,handleComplete }) => {

  return (
    <MuiOtpInput
      display="flex"
      gap={5}
      value={value}
      onChange={handleInputChange}
      onComplete={handleComplete}
      autoFocus={autoFocus}
      length={6} 
    />
  );
};

export default OtpInput;
