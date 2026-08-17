// "use client"
// import React, { useState } from 'react';
// import axios from 'axios';
// import { FaDownload } from 'react-icons/fa';
// import { CgSpinner } from 'react-icons/cg';
// import { Button } from '@/components/ui/button';
// import { useCurrentUser } from '@/app/hooks/use-current-user';

// const FileDownloader = ({ url, text, fileName, className = '' }: { url: string, text: string, fileName: string, className: string }) => {
//     const [isLoading, setIsLoading] = useState(false);
//     const user = useCurrentUser();
//     const handleDownload = async () => {
//         setIsLoading(true);
//         try {
//             const response = await axios.get(url, {
//                 responseType: 'blob',
//                 headers: {
//                     compcode: user?.Comp_Code,name:user?.name,
//                     token: user?.email
//                 }
//             });
//             const blob = new Blob([response.data], { type: response.headers['content-type'] });
//             const link = document.createElement('a');
//             link.href = URL.createObjectURL(blob);
//             link.download = `${fileName} ${new Date().toDateString()}.xlsx`; // set default download file name or make it dynamic
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//             setTimeout(() => {
//                 setIsLoading(false);
//             }, 500);
//         } catch (error) {
//             console.error('Download error:', error);
//             setIsLoading(false);
//         } finally {
//         }
//     };

//     return (
//         <>
//             <div className={`flex gap-2 ${className}`} >
//                 <div onClick={handleDownload} className="w-full cursor-pointer text-center flex justify-between pl-3 bg-[#dbeafe] text-[#1e40af] rounded-full shadow-sm shadow-dark font-medium">
//                     <p className="text-center pt-1">
//                         {isLoading ? (
//                             <>Downloading....</>
//                         ) : (
//                             <>
//                                 {text}
//                             </>
//                         )}
//                     </p>
//                     <Button className="bg-[#2b56f2d8] rounded-r-full ml-2 text-white h-full p-2 w-12">
//                         {isLoading ? (
//                             <CgSpinner className="animate-spin  text-white" />
//                         ) : (
//                             <FaDownload />
//                         )}
//                     </Button>
//                 </div>
//             </div >
//         </>
//     );
// };

// export default FileDownloader;




"use client"
import React, { useState } from 'react';
import axios from 'axios';
import { FaDownload } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/app/hooks/use-current-user';

const FileDownloader = ({
  url,
  text,
  fileName,
  className = '',
  icon,
  IsActive = false
}: {
  url: string,
  text: string,
  fileName: string,
  className?: string,
  icon?: React.ReactNode,
  IsActive?: boolean
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const user = useCurrentUser();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          token: user?.email
        }
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName} ${new Date().toDateString()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  // Apply background highlight only based on IsActive
  const highlightStyles = IsActive
    ? 'bg-[#4a6cf7] text-white dark:text-white'
    : 'bg-[#dbeafe] text-[#1e40af]';

  return (
    <div className={`flex gap-2 ${className}`}>
      <div
        onClick={handleDownload}
        className={`w-full cursor-pointer text-center flex justify-between pl-3 rounded-full shadow-sm shadow-dark font-medium transition-all duration-150 ${highlightStyles}`}
      >
        <p className="text-center pt-1 flex items-center gap-1">
          {isLoading ? 'Downloading...' : <>{icon}{text}</>}
        </p>

        <Button className="bg-[#2b56f2d8] rounded-r-full ml-2 text-white h-full p-2 w-12">
          {isLoading ? (
            <CgSpinner className="animate-spin text-white" />
          ) : (
            <FaDownload />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileDownloader;