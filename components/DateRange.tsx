import React from 'react';
import { useDateRange } from '@/app/hooks/use-date-range'; // Adjust the path based on your project structure

const DateRangeSelector = () => {
    const [dateRange, setDateRange] = useDateRange();
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDateRange((prevRange) => ({
            ...prevRange,
            [name]: value,
        }));
    };
    return (

        <div className='max-w-md'>
            <div className='flex-row lg:flex items-center lg:space-x-2'>
                <label className='block'>
                    <span className='px-2'>Date From</span>
                    <input
                        type="date"
                        name="from"
                        value={dateRange.from}
                        onChange={handleInputChange}
                        className='ml-2 w-[430px] px-4 py-1 text-[#667085] dark:bg-input border border-[#b5bfcb] rounded-md shadow-sm focus:ring focus:ring-blue-300 focus:border-blue-500'
                    />
                </label>
                <label className='block'>
                    <span className='px-2'>Date To</span>
                    <input
                        type="date"
                        name="to"
                        value={dateRange.to}
                        onChange={handleInputChange}
                        className='ml-2 w-[430px] px-4 py-1 text-[#667085]  dark:bg-input border border-[#b5bfcb] rounded-md shadow-sm focus:ring focus:ring-blue-300 focus:border-blue-500'
                    />
                </label>
            </div>
        </div>
    );
};

export default DateRangeSelector;