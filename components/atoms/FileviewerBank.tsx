import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import { MdCropRotate, MdZoomIn, MdZoomOut } from "react-icons/md";
import { FaRegFilePdf } from "react-icons/fa6";

const FileViewer = ({
  fileLink,
  celldata = "",
  Title = "",
}: {
  fileLink: string;
  celldata: string;
  Title: string;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFileLink, setModalFileLink] = useState("");
  const [rotation, setRotation] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif)$/i.test(url);
  const isPdf = (url: string) => /\.pdf$/i.test(url);

  const openModal = (link: string | null) => {
    setModalFileLink(link ? link : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalFileLink("");
    setRotation(0); // Reset rotation on close
  };

  const rotateImage = () => {
    setRotation((prevRotation) => prevRotation + 90);
  };
  const zoomImage = (IN_OUT) => {
    if (IN_OUT) {
      setZoomLevel((prev) => prev + 0.2); // Cycles through zoom levels: 1 → 1.5 → 2 → Reset (1)
    } else {
      setZoomLevel((prev) => prev - 0.2); // Cycles through zoom levels: 1 → 1.5 → 2 → Reset (1)
    }
  };

  return (
    <div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          {/* Full-screen modal content */}
          <div className="relative bg-white dark:bg-primary dark:bg-opacity-25 p-3 w-[1700px] h-[750px] rounded shadow-lg mx-auto flex flex-col items-center justify-center overflow-auto">
            {isImage(modalFileLink) ? (
              <>
                <div className="rounded shadow shadow-dark mt-1 bg-white p-2 dark:bg-dark sticky top-0 z-20">
                  <strong>
                    {typeof Title === "string" ? Title.toUpperCase() : Title}
                  </strong>
                </div>

                <img
                  src={modalFileLink}
                  alt="File Preview"
                  className="max-w-full max-h-full mx-auto dark:text-white text-black transition-transform duration-300"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
                    transition: "transform 0.5s ease-in-out", // Smooth zoom & rotation
                  }}
                />
              </>
            ) : isPdf(modalFileLink) ? (
              <iframe
                src={modalFileLink}
                title="PDF Preview"
                className="w-full h-full mx-auto dark:text-white text-black"
                style={{ border: "none" }}
              ></iframe>
            ) : (
              <a href={modalFileLink} target="_blank" rel="noopener noreferrer">
                <span>View File</span>
              </a>
            )}

            {/* Icons overlaid on top */}
            <div className="absolute top-8 right-4 flex flex-col space-y-2">
              <button
                className="bg-save text-2xl font-semibold dark:text-white text-white rounded-full w-8 h-8 flex items-center justify-center "
                onClick={closeModal}
              >
                &times;
              </button>
              <button
                className="bg-green-500 text-xl font-semibold dark:text-white text-white rounded-full w-10 h-10 flex items-center justify-center"
                onClick={() => window.open(modalFileLink, "_blank")}
              >
                <FaDownload />
              </button>
              {isImage(modalFileLink) && (
                <>
                  <button
                    className="bg-yellow-500 text-xl font-semibold dark:text-white text-black rounded-full w-10 h-10 flex items-center justify-center"
                    onClick={rotateImage}
                  >
                    <MdCropRotate />
                  </button>
                  <button
                    className="bg-blue-500 text-2xl font-semibold dark:text-white text-black rounded-full w-10 h-10 flex items-center justify-center"
                    onClick={() => zoomImage(1)} // Call zoom function
                  >
                    <MdZoomIn />
                  </button>
                  <button
                    className="bg-blue-500 text-2xl font-semibold dark:text-white text-black rounded-full w-10 h-10 flex items-center justify-center"
                    onClick={() => zoomImage(0)} // Call zoom function
                  >
                    <MdZoomOut />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conditional rendering based on file type */}
      {isImage(fileLink) ? (
        <a
          href="#"
          className="font-medium ml-1 text-primary dark:text-primary capitalize hover:underline"
          onClick={() => openModal(fileLink)}
        >
          View Image
        </a>
      ) : isPdf(fileLink) ? (
        <a
          href="#"
          className="font-medium ml-1 text-primary dark:text-primary capitalize hover:underline"
          onClick={() => openModal(fileLink)}
        >
          View PDF
        </a>
      ) : !celldata ? (
        <a
          href={fileLink}
          target="_blank"
          className="font-medium ml-1 text-primary dark:text-primary capitalize hover:underline"
          rel="noopener noreferrer"
        >
          <span>Download File</span>
        </a>
      ) : (
        <>{celldata}</>
      )}
    </div>
  );
};

export default FileViewer;
