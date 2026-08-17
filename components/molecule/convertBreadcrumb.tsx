'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { HiMiniQuestionMarkCircle, HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import { FaPlayCircle } from 'react-icons/fa';
import YoutubeUrlManager from './youtubeUrlManager';
import useFetchAndStore from '@/app/hooks/Youtube-Urls';
import axios from 'axios';
import { useCurrentUser } from '@/app/hooks/use-current-user';

type TBreadCrumbProps = {
  homeElement: React.ReactNode;
  separator: React.ReactNode;
  pdfUrl: string;
  pdfName: string;
  youtubeUrl: string; // YouTube video URL
  containerClasses?: string;
  listClasses?: string;
  activeClasses?: string;
  capitalizeLinks?: boolean;
};

const NextBreadcrumb = ({
  homeElement,
  separator,
  pdfUrl,
  pdfName,
  youtubeUrl,
  containerClasses,
  listClasses,
  activeClasses,
  capitalizeLinks,
}: TBreadCrumbProps) => {
  const paths = usePathname();
  const pathNames = paths.split('/').filter((path) => path);
  const [showTooltip, setShowTooltip] = useState(false);
  const [Download, setDownload] = useState(false);
  const [AnotherLoader, setAnotherLoader] = useState(true);
  const [YouTubeUrls, setYouTubeUrls] = useState({});
  const [error, setError] = useState("");

  // Function to download the PDF
  const handleDownload = async () => {
    try {
      setError("");
      setDownload(true);
      const response = await fetch(`https://erp.autovyn.com/backend/fetch?filePath=AUTOVYN_PDF/${pathNames[pathNames.length - 1]}.pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch the file.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${pathNames[pathNames.length - 1]}-Guide.pdf`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("File not Available")
      console.error('Error downloading the file:', error);
    } finally {
      setDownload(false);
    }
  };
  const user = useCurrentUser();
  const fetchData = async () => {
    try {
      setError("");
      setAnotherLoader(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/FindYoutubeUrls`,
        { Erp_Url: pathNames?.join('/') },
        {
          headers: {
            compcode: user?.Comp_Code,name:user?.name,
          },
        }
      );
      setYouTubeUrls(response.data[0]);

      // localStorage.setItem("YoutubeUrls", JSON.stringify(response.data));
    } catch (error) {
      setError("Video not Available")
      console.error("Error fetching data:", error);
    } finally {
      setTimeout(() => {
        setAnotherLoader(false);
      }, 350);
    }
  };
  useEffect(() => {
    if (showTooltip) {
      fetchData();
    }
  }, [showTooltip])
  // Function to open YouTube video in new window
  const handleOpenVideo = () => {
    try {
      const videoId = new URL(YouTubeUrls.YoutubeUrl).searchParams.get("v");
      if (videoId) {
        const videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&showinfo=0&controls=1`;
        window.open(videoEmbedUrl, '_blank', 'width=1200,height=600,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no');
      }
    } catch (error) {
      setError("Video not Available")
    }
  };
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <div className="bg-[#f3f8fc] dark:bg-black dark:text-[#37a9dd] shadow-b300  border-b-2 border-borderColor-dark text-header relative flex items-center mb-3  w-full px-1">
      <ul className={containerClasses}>
        <li className={listClasses}>
          <Link href={'/branch'}>{homeElement}</Link>
        </li>
        {pathNames.length > 0 && separator}
        {pathNames.map((link, index) => {
          let href = `/${pathNames.slice(0, index + 1).join('/')}`;
          let itemClasses = paths === href ? `${listClasses} ${activeClasses}` : listClasses;
          let itemLink = capitalizeLinks ? link[0].toUpperCase() + link.slice(1) : link;
          return (
            <React.Fragment key={index}>
              <li className={itemClasses}>
                {/* <Link href={href}>{itemLink}</Link> */} 
                {/*change by rakesh sir suggested by gopal sir for lead management */}
                {href === "/autovyn/preSales/Lead_Management" ? (
                  <span>{itemLink}</span>
                ) : (
                  <Link href={href}>{itemLink}</Link>
                )}


              </li>
              {pathNames.length !== index + 1 && separator}
            </React.Fragment>
          );
        })}
      </ul>

      {/* Help (?) Icon */}
      <div className="relative group ml-4">
        <button className="transition-colors text-xl duration-200 flex items-center"
          onClick={() => setShowTooltip(!showTooltip)}
        >
          {showTooltip ? <HiMiniQuestionMarkCircle /> : <HiOutlineQuestionMarkCircle />}
        </button>
        {showTooltip && (

          <div
            ref={tooltipRef}
            className="absolute z-50  font-semibold ring-2 top-full left-1/2 sm:left-[40%] md:left-[30%] lg:left-[25%] transform -translate-x-1/2 mt-2 w-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-3 py-2 text-sm bg-white dark:bg-dark rounded shadow-xl transition-opacity duration-200"
          >
            {AnotherLoader ? (
              <>
                Loading...
              </>
            ) : (<>
              <div className='flex  sm:flex-nowrap justify-center flex-wrap items-center'>

                <span className="whitespace-nowrap">Need Help?</span>

                <Button
                  className="px-3 ml-2 rounded-[20px] my-1 py-1 bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors duration-200"
                  onClick={handleDownload}
                  loading={Download}
                >
                  Download PDF
                </Button>

                <button
                  className="ml-4 bg-exit rounded-full p-2 shadow-lg hover:bg-opacity-75 hover:bg-exit transition-colors duration-200"
                  onClick={handleOpenVideo}
                >
                  <FaPlayCircle size={24} />
                </button>
              </div>
              <div className='flex items-center font-semibold justify-center text-exit'>
                {error}
              </div>
              {user?.id == '1' && (
                <YoutubeUrlManager Erp_Url={pathNames} fetchData={fetchData} />
              )}
            </>)}

          </div>


        )}
      </div>

      {/* YouTube Video Button */}

    </div>
  );
};

export default NextBreadcrumb;
