import React, { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import { MdCameraAlt, MdFlipCameraIos, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";
import NextArrow from "./NextArrow";
import PrevArrow from "./PrevArrow";

interface CaptureImagesProps {
  defaultImages: any;
  setFormData: (formData: FormData) => void;
  isCameraEnabled: boolean;
  disabled: boolean;
}

const CaptureImages: React.FC<CaptureImagesProps> = ({
  defaultImages,
  setFormData,
  isCameraEnabled,
  disabled
}) => {
  const [images, setImages] = useState(defaultImages);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");

  const getMediaStream = () => {
    const constraints = {
      video: { facingMode: cameraFacingMode },
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constraints).then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }).catch((error) => {
        console.error("Error accessing camera:", error);
      });
    } else {
      console.error("getUserMedia is not supported by this browser.");
    }
  };

  const stopMediaStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isCameraEnabled) {
      getMediaStream();
    } else {
      stopMediaStream();
    }
    return stopMediaStream;
  }, [isCameraEnabled, cameraFacingMode]);
  useEffect(() => {
    setImages(defaultImages)
  }, [defaultImages]);

  const handleCameraToggle = () => {
    setCameraFacingMode((prevMode) => (prevMode === "environment" ? "user" : "environment"));
  };

  const handleCapture = () => {
    const canvas = document.createElement("canvas");
    const video = videoRef.current;

    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageDataUrl = canvas.toDataURL("image/png");
      setImages((prevImages) => [...prevImages, imageDataUrl]);
    }
  };

  const handleDeleteImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const uploadImages = async () => {
      const a = new FormData();
      await Promise.all(
        images.map(async (image, index) => {
          const blob = await (await fetch(image)).blob();
          a.append(`image_${index}`, blob, `image_${index}.png`);
        })
      );
      setFormData((prevData) => ({ ...prevData, a }));
    };

    uploadImages();
  }, [images, setFormData]);

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  return (
    <div className="lg:col-span-2 md:col-span-12 col-span-12 lg:mt-2">
      <div className="grid grid-cols-12">
        <div className="lg:col-span-12 md:col-span-6 col-span-12 m-8">
          {images.length > 0 ? (
            <Slider {...sliderSettings}>
              {images.map((imageSrc, index) => (
                <div key={index} className="relative">
                  {/* {imageSrc} */}
                  <img src={imageSrc} alt={`Captured ${index}`} className="h-full w-full rounded-lg" />
                  {/* <Button
                    onClick={() => handleDeleteImage(index)}
                    disabled={disabled}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-[#dc2626] p-2 rounded-full"
                  >
                    <MdDelete size={24} />
                  </Button> */}
                </div>
              ))}
            </Slider>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              No images captured. Please capture an image.
            </div>
          )}
        </div>
        {isCameraEnabled && (
          <div className="mt-2 flex justify-center lg:col-span-12 md:col-span-6 col-span-12">
            <video className="lg:h-44 h:72" ref={videoRef} autoPlay playsInline muted></video>
          </div>
        )}
        <div className="flex justify-center col-span-12 mt-4">
          <Button onClick={handleCapture} variant="contained" color="primary" disabled={disabled}>
            <MdCameraAlt size={32} />
            Capture
          </Button>
          <Button onClick={handleCameraToggle} variant="contained" color="secondary">
            <MdFlipCameraIos size={32} />
            Flip Camera
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaptureImages;
