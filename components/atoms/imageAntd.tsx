// import { useRef } from "react";
// import {
//   DownloadOutlined,
//   LeftOutlined,
//   RightOutlined,
//   RotateLeftOutlined,
//   RotateRightOutlined,
//   SwapOutlined,
//   UndoOutlined,
//   ZoomInOutlined,
//   ZoomOutOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons";
// import { Image, Space } from "antd";
// import { FC } from "react";

// interface imageAntdProps {
//   imageSrc: string[];
//   Index: number;
//   AltText?: string;
//   disabled: boolean;
//   setImageSrc: (src: string[]) => void;
//   handleFileChange: (
//     event: React.ChangeEvent<HTMLInputElement>,
//     index: number
//   ) => void;
// }

// const ImageAntd: FC<imageAntdProps> = ({
//   imageSrc,
//   setImageSrc,
//   handleFileChange,
//   Index,
//   disabled,
//   AltText = "Upload Image", // Default AltText if none provided
// }) => {
//   // Add a reference to the file input
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const handleDelete = () => {
//     setImageSrc((prevSrc) => {
//       const newSrc = [...prevSrc];
//       newSrc[Index] = ""; // Clear the current image source
//       return newSrc;
//     });
//   };

//   const onDownload = () => {
//     const url = imageSrc[Index];
//     const suffix = url.slice(url.lastIndexOf("."));
//     const filename = Date.now() + suffix;

//     fetch(url)
//       .then((response) => response.blob())
//       .then((blob) => {
//         const blobUrl = URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = blobUrl;
//         link.download = filename;
//         document.body.appendChild(link);
//         link.click();
//         URL.revokeObjectURL(blobUrl);
//         link.remove();
//       });
//   };

//   const handleFileInputChange = (
//     event: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     handleFileChange(event, Index);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""; // Reset the input after image is uploaded
//     }
//   };

//   return (
//     <div className="dark:bg-primary dark:bg-opacity-10 bg-white rounded-lg shadow col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 h-16">
//       <label className="md:mt-6 flex w-full h-full sm:h-56 md:h-2 lg:h-6  items-center justify-center rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-600">
//         {imageSrc[Index] ? (
//           <div className="relative mt-2 h-full">
//             <Image
//               preview={{
//                 src: imageSrc[Index],
//                 toolbarRender: (
//                   _,
//                   {
//                     transform: { scale },
//                     actions: {
//                       onActive,
//                       onFlipY,
//                       onFlipX,
//                       onRotateLeft,
//                       onRotateRight,
//                       onZoomOut,
//                       onZoomIn,
//                       onReset,
//                     },
//                   }
//                 ) => (
//                   <Space size={20} className="toolbar-wrapper">
//                     <LeftOutlined onClick={() => onActive?.(-1)} />
//                     <RightOutlined onClick={() => onActive?.(1)} />
//                     <DownloadOutlined onClick={onDownload} />
//                     <SwapOutlined rotate={90} onClick={onFlipY} />
//                     <SwapOutlined onClick={onFlipX} />
//                     <RotateLeftOutlined onClick={onRotateLeft} />
//                     <RotateRightOutlined onClick={onRotateRight} />
//                     <ZoomOutOutlined
//                       disabled={scale === 1}
//                       onClick={onZoomOut}
//                     />
//                     <ZoomInOutlined
//                       disabled={scale === 50}
//                       onClick={onZoomIn}
//                     />
//                     <UndoOutlined onClick={onReset} />
//                   </Space>
//                 ),
//               }}
//               src={imageSrc[Index]}
//               alt={AltText}
//               height={60}
//               width={150}
//               className="h-full w-full object-cover rounded-lg "
//             />
//           </div>
//         ) : (
//           <span className="flex flex-col items-center text-gray-500 dark:text-gray-400 w-56 mt-8">
//             <svg
//               className="w-9 h-9 text-gray-800 dark:text-white"
//               aria-hidden="true"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M12 3c.3 0 .6.1.8.4l4 5a1 1 0 1 1-1.6 1.2L13 7v7a1 1 0 1 1-2 0V6.9L8.8 9.6a1 1 0 1 1-1.6-1.2l4-5c.2-.3.5-.4.8-.4ZM9 14v-1H5a2 2 0 0 0-2 2v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-4v1a3 3 0 1 1-6 0Zm8 2a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <span className="mt-0 text-sm text-gray-600">{AltText}</span>
//           </span>
//         )}
//         <input
//           type="file"
//           className="hidden"
//           name="images"
//           accept="image/png, image/jpeg, image/jpg,application/pdf"
//           onChange={handleFileInputChange}
//           disabled={disabled}
//           ref={fileInputRef}
//         />
//       </label>
//     </div>
//   );
// };

// export default ImageAntd;




import { useRef } from "react";
import {
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Image, Space, Tooltip } from "antd";
import { FC } from "react";

interface imageAntdProps {
  imageSrc: string[];
  Index: number;
  AltText?: string;
  disabled: boolean;
  setImageSrc: (src: string[]) => void;
  handleFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => void;
}

const ImageAntd: FC<imageAntdProps> = ({
  imageSrc,
  setImageSrc,
  handleFileChange,
  Index,
  disabled,
  AltText = "Upload Image",
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDelete = () => {
    setImageSrc((prevSrc) => {
      const newSrc = [...prevSrc];
      newSrc[Index] = "";
      return newSrc;
    });
  };

  const onDownload = () => {
    const url = imageSrc[Index];
    const suffix = url.slice(url.lastIndexOf("."));
    const filename = Date.now() + suffix;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(blobUrl);
        link.remove();
      });
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFileChange(event, Index);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isPdf = imageSrc[Index]?.toLowerCase().endsWith(".pdf");

  return (
    <div className="dark:bg-primary dark:bg-opacity-10 bg-white rounded-lg shadow col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 h-24">
      <label
        className={`flex flex-col w-full h-full items-center justify-center rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-600 p-4`}
      >
        {imageSrc[Index] ? (
          isPdf ? (
            <div className="flex flex-col items-center justify-center  ">
              <FilePdfOutlined
                style={{ fontSize: 32, color: "#E53E3E" }}
                className="mb-2"
              />
              <Tooltip title={AltText}>
                <p className="text-sm text-center truncate w-full px-1 mb-2 dark:text-gray-200">
                  {AltText || "PDF Document"}
                </p>
              </Tooltip>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onDownload}
                  className=" hover:underline text-xs"
                >
                  Download
                </button>
                {/* <button
                  type="button"
                  onClick={handleDelete}
                  className=" hover:underline text-xs"
                >
                  Delete
                </button> */}
              </div>
            </div>
          ) : (
            <div className="relative max-w-[300px] max-h-[300px] mx-auto">

              <Image
                preview={{
                  src: imageSrc[Index],
                  toolbarRender: (
                    _,
                    {
                      transform: { scale },
                      actions: {
                        onActive,
                        onFlipY,
                        onFlipX,
                        onRotateLeft,
                        onRotateRight,
                        onZoomOut,
                        onZoomIn,
                        onReset,
                      },
                    }
                  ) => (
                    <Space size={20} className="toolbar-wrapper">
                      <LeftOutlined onClick={() => onActive?.(-1)} />
                      <RightOutlined onClick={() => onActive?.(1)} />
                      <DownloadOutlined onClick={onDownload} />
                      <SwapOutlined rotate={90} onClick={onFlipY} />
                      <SwapOutlined onClick={onFlipX} />
                      <RotateLeftOutlined onClick={onRotateLeft} />
                      <RotateRightOutlined onClick={onRotateRight} />
                      <ZoomOutOutlined
                        disabled={scale === 1}
                        onClick={onZoomOut}
                      />
                      <ZoomInOutlined
                        disabled={scale === 50}
                        onClick={onZoomIn}
                      />
                      <UndoOutlined onClick={onReset} />
                    </Space>
                  ),
                }}
                src={imageSrc[Index]}
                alt={AltText}
                height={100}
                width={150}
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="absolute top-2 right-2 z-10">
                <DeleteOutlined
                  onClick={handleDelete}
                  className="text-red-600 cursor-pointer hover:text-red-400"
                />
              </div>
            </div>
          )
        ) : (
          <span className="flex flex-col items-center text-gray-500 dark:text-gray-400 w-56">
            <svg
              className="w-9 h-9 text-gray-800 dark:text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M12 3c.3 0 .6.1.8.4l4 5a1 1 0 1 1-1.6 1.2L13 7v7a1 1 0 1 1-2 0V6.9L8.8 9.6a1 1 0 1 1-1.6-1.2l4-5c.2-.3.5-.4.8-.4ZM9 14v-1H5a2 2 0 0 0-2 2v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-4v1a3 3 0 1 1-6 0Zm8 2a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="mt-0 text-sm text-gray-600">{AltText}</span>
          </span>
        )}
        <input
          type="file"
          className="hidden"
          name="images"
          accept="image/png, image/jpeg, image/jpg,application/pdf"
          onChange={handleFileInputChange}
          disabled={disabled}
          ref={fileInputRef}
        />
      </label>
    </div>
  );
};

export default ImageAntd;
