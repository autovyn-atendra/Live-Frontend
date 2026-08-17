"use client"
import React, { useState } from 'react';
import axios from 'axios';
import Ainput from '@/components/atoms/Input';
import { Button } from '@/components/ui/button';
import { CgSpinner } from 'react-icons/cg';
import { useCurrentUser } from '@/app/hooks/use-current-user';

const PanValidationPage = () => {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPan, setloadingPan] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState('');
  const user = useCurrentUser();

  // API call function
  const handleApiCall = async (type) => {
    setError('');
    setResponseData(null);

    try {
      let response;
      if (type === 'aadhaar') {
        setLoading(true);
        // Replace with actual Aadhaar API endpoint
        try {
          response = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validateSurePass`,
            {
              option: "AADHAR_WITHOUT_OTP",
              value: aadhaarNumber
            },
            {
              headers: {
                compcode: user?.Comp_Code,
                // compcode: user?.Comp_Code,
              },
            }
          );
        } catch (error) {
          console.error('Error fetching statuses:', error);
        }
        setLoading(false);
      } else if (type === 'pan') {
        setloadingPan(true);
        // Replace with actual PAN API endpoint
        try {
          response = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validateSurePass`,
            {
              option: "PAN_COMPREHENSIVE",
              value: panNumber
            },
            {
              headers: {
                compcode: user?.Comp_Code,
                // compcode: user?.Comp_Code,
              },
            }
          );
        } catch (error) {
          console.error('Error fetching statuses:', error);
        }
        setloadingPan(false);
      }

      setResponseData(response.data);
    } catch (err) {
      setLoading(false);
      setloadingPan(false);

      setError('Failed to fetch data. Please try again.');
    } finally {
    }
  };
  const renderData = (data, depth = 0) => {
    if (typeof data !== 'object' || data === null) {
      return <p className="ml-4">{data?.toString()}</p>;
    }

    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="ml-4">
        <p className="font-semibold text-gray-800 dark:text-gray-200">
          {key}:
        </p>
        <div className="ml-4 border-l-2 border-gray-300 dark:border-gray-700 pl-2">
          {typeof value === 'object' && value !== null
            ? renderData(value, depth + 1)
            : <p>{value?.toString()}</p>}
        </div>
      </div>
    ));
  };
  return (
    <div className="flex gap-4 justify-center bg-gray-100 dark:bg-gray-900">
      <div className="p-6 bg-white dark:bg-[#162458] rounded-lg shadow-lg max-w-lg w-full space-y-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">PAN & Aadhaar Validation</h2>

        {/* Input Fields */}
        <div className="space-y-4 ">
          <div className='flex  gap-2 items-end'>
            <Ainput
              title="PAN Number"
              type="text"
              name="Pan"
              value={panNumber}
              className='ring-1'
              handleInputChange={(name, value) => { setPanNumber(value) }}
            />
            <Button
              size={"sm"}

              onClick={() => handleApiCall('pan')}
              variant={"save"} className='w-[100px]'  >
              {loadingPan ? (
                <CgSpinner className="animate-spin text-xl text-white" />
              ) : (
                'Validate PAN'
              )}
            </Button>

          </div>
          <div className='flex  gap-2 items-end'>

            <Ainput
              title="Aadhaar Number"
              type="text"
              name="Status"
              value={aadhaarNumber}
              className='ring-1'

              handleInputChange={(name, value) => { setAadhaarNumber(value) }}
            />
            <Button
              size={"sm"}

              onClick={() => handleApiCall('aadhaar')}
              variant={"save"}
              disabled={loading} className='w-[140px]'>
              {loading ? (
                <CgSpinner className="animate-spin text-xl text-white" />
              ) : (
                'Validate Aadhaar'
              )}
            </Button>
          </div>


        </div>
      </div>
      <div className="p-1 bg-white dark:bg-[#162458] rounded-lg shadow-lg max-w-lg w-full space-y-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Response</h2>


        {/* Error Message */}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Display API Response */}
        {responseData && (
          <div className="p-4 mt-4 bg-gray-100 dark:bg-gray-800 rounded-md ">
            {/* <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">API Response</h3>
            <p className="text-gray-700 dark:text-gray-300"><strong>Status Code:</strong> {responseData.statuscode}</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Message:</strong> {responseData.message}</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Reference ID:</strong> {responseData.reference_id}</p> */}
            <div className="text-gray-700 dark:text-gray-300">
              <strong>Data:</strong>
              <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded-md mt-1 overflow-auto">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanValidationPage;
