"use client";

import { useState, useRef, ChangeEvent, DragEvent, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  Thermometer,
  Compass,
  ArrowRight,
  Info,
  ShieldCheck,
  FileImage,
  Loader2,
  Eye,
  SlidersHorizontal,
  SwitchCamera,
  Zap,
  ZapOff,
  X,
  Scan,
  Maximize2,
  Crop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios, { AxiosError } from "axios";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_URL;

interface SourceReading {
  value: number | null;
  unit: "KM" | "MILES" | "UNKNOWN";
  rawText?: string | null;
  unitEvidence?: string | null;
}

interface NormalizedReading {
  value: number | null;
  unit: "KM";
  conversionApplied: boolean;
  conversionFactor?: number | null;
}

interface OdometerReading {
  value: number | null;
  unit: "KM" | "MILES" | "UNKNOWN";
  formattedValue: string | null;
  rawText?: string | null;
  normalizedKMValue?: number | null;
  unitEvidence?: string | null;
}

interface OtherReading {
  type: "SPEED" | "TRIP" | "TIME" | "TEMPERATURE" | "RANGE" | "OTHER";
  value: string | number;
  unit: string | null;
  unitEvidence?: string | null;
}

interface QualityInfo {
  imageClarity?: "GOOD" | "ACCEPTABLE" | "POOR";
  overall?: "GOOD" | "ACCEPTABLE" | "POOR";
  blur: "LOW" | "MEDIUM" | "HIGH";
  dashboardVisible?: boolean;
  glare?: "LOW" | "MEDIUM" | "HIGH";
  readingVisible?: boolean;
}

interface OdometerEvidence {
  readingVisible: boolean;
  cumulativeReadingIdentified: boolean;
  associatedUnitVisible: boolean;
  regionDescription?: string | null;
}

interface OdometerReadability {
  digitsVisible: boolean;
  digitsReadable: boolean;
  unitReadable: boolean;
}

interface ERPValidation {
  previousReading: number;
  currentReading: number;
  difference: number;
  status: "PASS" | "SUSPICIOUS_READING" | "REVIEW_RECOMMENDED";
  message: string;
}

interface OdometerApiResponse {
  success: boolean;
  type?: string;
  status?: string;
  source?: SourceReading | null;
  normalized?: NormalizedReading | null;
  odometer?: OdometerReading | null;
  displayType?: string;
  confidence?: {
    reading: number | null;
    unit: number | null;
    classification: number;
  };
  requiresManualReview?: boolean;
  reviewReason?: string | null;
  message?: string;
  quality?: QualityInfo;
  odometerEvidence?: OdometerEvidence;
  odometerReadability?: OdometerReadability;
  otherReadings?: OtherReading[];
  erpValidation?: ERPValidation | null;
  latencyMs?: number;
  modelUsed?: string;
  debug?: Record<string, unknown>;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AIImageAssistantPage() {
  const user = useCurrentUser();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previousKm, setPreviousKm] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [result, setResult] = useState<OdometerApiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera States
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(2.0);
  const [hasHardwareZoom, setHasHardwareZoom] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reticleRef = useRef<HTMLDivElement | null>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Clean stop all camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraLoading(false);
    setTorchOn(false);
    setHasTorch(false);
    setCameraError(null);
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Dynamic loading stage text transitions
  useEffect(() => {
    if (!loading) return;
    const stages = [
      "Uploading image...",
      "Analyzing dashboard cluster...",
      "Detecting mechanical/digital digits...",
      "Filtering out trip meters & speed...",
      "Validating reading & unit...",
    ];
    let idx = 0;
    setLoadingStage(stages[0]);

    const interval = setInterval(() => {
      idx = (idx + 1) % stages.length;
      setLoadingStage(stages[idx]);
    }, 1200);

    return () => clearInterval(interval);
  }, [loading]);

  // Start Camera Stream
  const startCamera = async (facing: "environment" | "user" = cameraFacingMode) => {
    setErrorMessage(null);
    setCameraError(null);
    setIsCameraLoading(true);
    setIsCameraOpen(true);

    // Stop previous stream if open
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser. Please use HTTPS or upload a file.");
      }

      let stream: MediaStream;
      try {
        // Request maximum possible clarity & resolution on mobile devices
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 3840, min: 1280 },
            height: { ideal: 2160, min: 720 },
            // @ts-ignore
            advanced: [{ focusMode: "continuous" }],
          },
          audio: false,
        });
      } catch (err) {
        // Fallback for devices where high-res constraint fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
          },
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for torch & zoom capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as Record<string, unknown>) : null;
        if (capabilities && "torch" in capabilities) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }

        if (capabilities && "zoom" in capabilities) {
          setHasHardwareZoom(true);
          try {
            await videoTrack.applyConstraints({
              advanced: [{ zoom: 2.0 } as unknown as MediaTrackConstraintSet],
            });
          } catch (_) {}
        } else {
          setHasHardwareZoom(false);
        }
      }

      setZoomLevel(2.0);
      setIsCameraLoading(false);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setIsCameraLoading(false);
      let msg = "Could not access device camera.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Camera permission denied. Please enable camera access in your browser settings.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No camera device found on this system.";
        } else {
          msg = err.message || "Failed to initialize camera.";
        }
      }
      setCameraError(msg);
    }
  };

  // Apply Camera Zoom (Hardware or Digital)
  const applyZoom = async (level: number) => {
    setZoomLevel(level);
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      if (hasHardwareZoom) {
        await videoTrack.applyConstraints({
          advanced: [{ zoom: level } as unknown as MediaTrackConstraintSet],
        });
      }
    } catch (_) {}
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const newTorchState = !torchOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.error("Torch error:", err);
    }
  };

  // Switch Camera Facing Mode (Front <-> Rear)
  const switchCameraFacing = async () => {
    const nextFacing = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextFacing);
    await startCamera(nextFacing);
  };

  // Trigger analysis API
  const executeAnalysis = async (fileToAnalyze?: File, prevReading?: string) => {
    const file = fileToAnalyze || selectedFile;
    if (!file) {
      setErrorMessage("Please select or capture an image first.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const prevVal = prevReading !== undefined ? prevReading : previousKm;
      if (prevVal && prevVal.trim()) {
        formData.append("previousOdometer", prevVal.trim());
      }

      const compcode =
        user?.Comp_Code ||
        "";
      const token = user?.token || user?.email || "";
      const authHeader = token
        ? String(token).startsWith("Bearer ")
          ? String(token)
          : `Bearer ${token}`
        : "";

      const response = await axios.post<OdometerApiResponse>(
        `${BASE_URL}/ai/image/odometer`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            compcode: String(compcode || ""),
            authorization: authHeader,
          },
        }
      );

      setResult(response.data);
    } catch (err: unknown) {
      console.error("Analysis error:", err);
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string; status?: string }>;
        setErrorMessage(
          axiosErr.response?.data?.message ||
            axiosErr.message ||
            "Unable to analyze image. Please check your network connection."
        );
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Capture Live Focused Snapshot from Video Stream (Crops EXACTLY the Reticle Box Area)
  const captureSnapshot = async () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera stream is not ready yet. Please wait a moment.");
      return;
    }

    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setCameraError("Could not process camera image.");
      return;
    }

    // Center-invariant Reticle Box Cropping (100% Mobile & Desktop Reliable)
    // The target box is positioned at the center of the viewfinder.
    // We crop the centered 82% width x 55% height region of the video frame, ensuring all digits and color drums are captured cleanly.
    let cropRatioW = 0.82;
    let cropRatioH = 0.55;

    // Apply digital zoom if active without cutting off side drums
    if (zoomLevel > 1.0 && !hasHardwareZoom) {
      cropRatioW = cropRatioW / zoomLevel;
      cropRatioH = cropRatioH / zoomLevel;
    }

    const sourceWidth = Math.min(video.videoWidth, video.videoWidth * cropRatioW);
    const sourceHeight = Math.min(video.videoHeight, video.videoHeight * cropRatioH);
    const sourceX = Math.max(0, (video.videoWidth - sourceWidth) / 2);
    const sourceY = Math.max(0, (video.videoHeight - sourceHeight) / 2);

    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to Blob & File with optimal quality
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Failed to capture snapshot from camera.");
          return;
        }

        const fileName = `odometer_box_crop_${Date.now()}.jpg`;
        const capturedFile = new File([blob], fileName, { type: "image/jpeg" });

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(capturedFile);
        const objectUrl = URL.createObjectURL(capturedFile);
        setPreviewUrl(objectUrl);

        // Stop camera
        stopCamera();

        // Immediately trigger AI analysis on cropped box only
        executeAnalysis(capturedFile, previousKm);
      },
      "image/jpeg",
      0.95
    );
  };

  // Crop Uploaded Image to Center Focus Box (for Gallery / Uploaded Images)
  const handleCropUploadedImage = async () => {
    if (!selectedFile) return;

    try {
      const img = new Image();
      const tempUrl = URL.createObjectURL(selectedFile);
      
      img.onload = () => {
        URL.revokeObjectURL(tempUrl);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Focus and crop the center 70% width and 45% height (odometer cluster region)
        const cropW = Math.round(img.width * 0.70);
        const cropH = Math.round(img.height * 0.45);
        const cropX = Math.round((img.width - cropW) / 2);
        const cropY = Math.round((img.height - cropH) / 2);

        canvas.width = cropW;
        canvas.height = cropH;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const fileName = `odometer_cropped_${Date.now()}.jpg`;
          const croppedFile = new File([blob], fileName, { type: "image/jpeg" });

          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setSelectedFile(croppedFile);
          const newUrl = URL.createObjectURL(croppedFile);
          setPreviewUrl(newUrl);

          // Re-analyze cropped image
          executeAnalysis(croppedFile, previousKm);
        }, "image/jpeg", 0.95);
      };

      img.src = tempUrl;
    } catch (err) {
      console.error("Crop error:", err);
    }
  };

  // File selection & preview
  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    setResult(null);

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage("Please upload a valid JPEG, PNG, or WebP image.");
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image file size is too large. Maximum allowed size is 10MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-analyze once file is selected
    executeAnalysis(file, previousKm);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    stopCamera();
    setSelectedFile(null);
    setZoomLevel(2.0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Display badge helpers
  const getStatusBadge = (res?: OdometerApiResponse | null) => {
    if (!res) return null;
    const isVerified =
      res.status === "VERIFIED" &&
      res.requiresManualReview !== true &&
      res.normalized?.value != null;

    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified Reading
        </span>
      );
    }

    if (res.status === "INVALID_UNIT_MILES") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Miles Not Supported
        </span>
      );
    }

    if (res.status === "UNIT_NOT_CONFIRMED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <HelpCircle className="w-3.5 h-3.5" />
          Unit Not Confirmed
        </span>
      );
    }

    if (res.status === "NO_ODOMETER_DETECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          No Odometer Detected
        </span>
      );
    }

    if (res.status === "MULTIPLE_ODOMETERS_DETECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Multiple Dashboards
        </span>
      );
    }

    if (res.status === "SUSPICIOUS_READING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" />
          Suspicious Reading
        </span>
      );
    }

    if (res.status === "REVIEW_RECOMMENDED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Review Recommended
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        Review Required
      </span>
    );
  };

  const formatDisplayType = (dt?: string) => {
    switch (dt) {
      case "MECHANICAL_ROLLER":
        return "Mechanical Roller Odometer";
      case "DIGITAL_LCD":
        return "Digital LCD Display";
      case "DIGITAL_CLUSTER":
        return "Digital Instrument Cluster";
      case "ANALOG_DIGITAL_MIXED":
        return "Analog-Digital Mixed Cluster";
      default:
        return dt || "Vehicle Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8">
      {/* HIDDEN OFFSCREEN CANVAS FOR SNAPSHOT */}
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-blue-600/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                <Gauge className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                AI Image Assistant
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Vision AI Scanner
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Live scan or upload a vehicle dashboard photo to automatically detect and extract the odometer reading.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {!isCameraOpen && (
              <Button
                onClick={() => startCamera()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
              >
                <Camera className="w-4 h-4 mr-2" />
                Live Camera Scan
              </Button>
            )}

            {selectedFile && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset / New Image
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: CAMERA / UPLOAD & PREVIEW */}
        <div className="lg:col-span-6 space-y-6">
          {/* CAMERA VIEWFINDER (WHEN ACTIVE) */}
          {isCameraOpen ? (
            <div className="relative rounded-3xl overflow-hidden border-2 border-blue-500 shadow-2xl bg-black min-h-[420px] flex flex-col justify-between">
              {/* LIVE VIDEO FEED */}
              <div className="relative w-full h-full flex items-center justify-center bg-black min-h-[380px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    transform: hasHardwareZoom ? "none" : `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: "transform 0.2s ease-out",
                  }}
                  className="w-full h-full object-cover max-h-[460px]"
                />

                {/* CAMERA LOADING SPINNER */}
                {isCameraLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-3" />
                    <p className="text-sm font-medium tracking-wide">Starting Camera Stream...</p>
                  </div>
                )}

                {/* CAMERA ERROR OVERLAY */}
                {cameraError && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center z-20 space-y-3">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                    <p className="text-sm text-rose-200">{cameraError}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startCamera()}
                        size="sm"
                        variant="input"
                        className="text-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                      </Button>
                      <Button
                        onClick={stopCamera}
                        size="sm"
                        variant="outline"
                        className="text-xs border-slate-700 text-slate-300"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}

                {/* HUD TARGET RETICLE OVERLAY */}
                {!isCameraLoading && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-10">
                    {/* TOP STATUS PILL */}
                    <div className="absolute top-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Meter Target
                    </div>

                    {/* RETICLE FRAME (COMPACT ODOMETER FOCUS BOX) */}
                    <div
                      ref={reticleRef}
                      className="relative w-[78%] max-w-[270px] h-[95px] md:h-[105px] rounded-xl border-2 border-cyan-400/90 shadow-[0_0_25px_rgba(6,182,212,0.45)] bg-cyan-500/10 flex items-center justify-center overflow-hidden"
                    >
                      {/* CORNER BRACKETS */}
                      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white" />
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white" />
                      <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white" />
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white" />

                      {/* SCANLINE ANIMATION */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-[bounce_2s_infinite] opacity-90" />

                      <p className="text-[11px] font-semibold text-white/95 drop-shadow text-center px-2">
                        Fit KM digits inside this box
                      </p>
                    </div>

                    {/* HINT SUBTITLE & QUICK ZOOM BUTTONS (1x to 4x) */}
                    <div className="flex flex-col items-center gap-1.5 mt-2.5 pointer-events-auto">
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
                        <span className="text-[10px] font-semibold text-white/80 mr-0.5">Zoom:</span>
                        {[1.0, 1.5, 2.0, 2.5, 3.0, 4.0].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => applyZoom(level)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                              zoomLevel === level
                                ? "bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.7)] scale-105"
                                : "bg-white/10 text-white/90 hover:bg-white/25"
                            }`}
                          >
                            {level === 1.0 ? "1x" : `${level}x`}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/75 drop-shadow">
                        Tip: Agar photo dur se le rahe hain toh 2x / 3x zoom karein
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CAMERA TOOLBAR BOTTOM */}
              <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 flex items-center justify-between gap-4 border-t border-white/10">
                {/* CLOSE CAMERA */}
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 p-0"
                  title="Close Camera"
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* SHUTTER CAPTURE BUTTON */}
                <button
                  type="button"
                  onClick={captureSnapshot}
                  disabled={isCameraLoading || !!cameraError}
                  className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white text-blue-600 shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
                  title="Capture & Scan"
                >
                  <div className="w-13 h-13 rounded-full border-2 border-blue-600 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                  </div>
                </button>

                {/* CAMERA CONTROLS (SWITCH & TORCH) */}
                <div className="flex items-center gap-2">
                  {hasTorch && (
                    <Button
                      onClick={toggleTorch}
                      variant="ghost"
                      size="sm"
                      className={`rounded-full h-10 w-10 p-0 ${
                        torchOn
                          ? "bg-amber-400 text-black hover:bg-amber-300"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                      title={torchOn ? "Turn Torch Off" : "Turn Torch On"}
                    >
                      {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                    </Button>
                  )}

                  <Button
                    onClick={switchCameraFacing}
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 p-0"
                    title="Switch Front/Rear Camera"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* UPLOAD & PREVIEW CARD */
            <div className="space-y-4">
              {/* ACTION QUICK SELECTOR (3 OPTIONS: NATIVE HD CAMERA, LIVE SCANNER, UPLOAD) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. NATIVE PHONE CAMERA (HD CLARITY WITH AUTOFOCUS & FLASH) */}
                <Button
                  type="button"
                  onClick={() => !loading && nativeCameraInputRef.current?.click()}
                  variant="outline"
                  className="h-12 border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  title="Take HD photo using phone's native camera"
                >
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Phone Camera (HD)</span>
                </Button>

                {/* 2. LIVE ON-SCREEN SCANNER */}
                <Button
                  type="button"
                  onClick={() => startCamera()}
                  variant="outline"
                  className="h-12 border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Live Viewfinder</span>
                </Button>

                {/* 3. GALLERY / FILE PICKER */}
                <Button
                  type="button"
                  onClick={() => !loading && fileInputRef.current?.click()}
                  variant="outline"
                  className="h-12 border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Upload / Gallery</span>
                </Button>
              </div>

              {/* UPLOAD / PREVIEW BOX */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !previewUrl && !loading && nativeCameraInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-6 md:p-8 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] text-center overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]"
                    : "border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/5"
                }`}
              >
                {/* NATIVE PHONE CAMERA INPUT */}
                <input
                  ref={nativeCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onFileInputChange}
                  disabled={loading}
                />

                {/* GALLERY / FILE PICKER INPUT */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={onFileInputChange}
                  disabled={loading}
                />

                {previewUrl ? (
                  <div className="relative w-full flex flex-col items-center">
                    <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 max-h-[340px] w-full bg-slate-950 flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Dashboard Preview"
                        className="max-h-[340px] w-auto object-contain rounded-2xl"
                      />
                      {loading && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
                          <p className="text-sm font-medium tracking-wide animate-pulse">{loadingStage}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between w-full px-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                      <span>
                        {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCropUploadedImage();
                        }}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="text-xs border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                        title="Crop to meter center box and re-scan"
                      >
                        <Crop className="w-3.5 h-3.5 mr-1.5" /> Crop / Focus Box
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startCamera();
                        }}
                        variant="input"
                        size="sm"
                        className="text-xs"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1.5" /> Retake with Live Camera
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" /> Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 py-6">
                    <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                        Click to upload or drag & drop image
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Supports JPEG, PNG, and WebP (up to 10MB)
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Auto-detects mechanical & digital odometers
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OPTIONAL PREVIOUS READING CARD */}
          <div className="p-4 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                Previous ERP Odometer (Optional)
              </label>
              <span className="text-[11px] text-slate-400">Validates for suspicious values</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g. 198420"
                value={previousKm}
                onChange={(e) => setPreviousKm(e.target.value)}
                disabled={loading}
                className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-sm"
              />
              {selectedFile && !loading && (
                <Button
                  onClick={() => executeAnalysis(selectedFile, previousKm)}
                  variant="input"
                  size="sm"
                  className="shrink-0"
                >
                  Re-Analyze
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYSIS RESULTS */}
        <div className="lg:col-span-6 space-y-6">
          {/* ERROR STATE */}
          {errorMessage && (
            <div className="p-5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3.5 text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Extraction Notice</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* MAIN RESULT CARD */}
          {result && (
            <div className="space-y-6">
              {/* PRIMARY DISPLAY CARD */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4" />
                    Odometer Extraction Result
                  </span>
                  {getStatusBadge(result)}
                </div>

                {/* DYNAMIC VALUE RENDERING - NEVER SHOW FALSE 0 KM */}
                <div className="py-2">
                  {result.status === "VERIFIED" && result.normalized?.value != null ? (
                    <div>
                      <div className="text-4xl md:text-5xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
                        {result.normalized.value.toLocaleString("en-IN")} KM
                      </div>
                    </div>
                  ) : result.status === "INVALID_UNIT_MILES" ? (
                    <div className="space-y-3">
                      <div className="text-2xl md:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                        MILES READING NOT ALLOWED
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {result.message ||
                          result.reviewReason ||
                          "Odometer reading is in Miles. AutoVyn ERP accepts only KM (Kilometers). Please scan a valid vehicle dashboard image with a KM reading."}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Detected:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {result.source?.rawText || result.source?.value || "N/A"} MILES
                        </strong>{" "}
                        (Auto-conversion to KM is disabled).
                      </p>
                      <Button
                        onClick={() => startCamera()}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-800 dark:text-rose-300"
                      >
                        <Camera className="w-3.5 h-3.5 mr-2" />
                        Live Scan KM Meter
                      </Button>
                    </div>
                  ) : result.status === "UNIT_NOT_CONFIRMED" ? (
                    <div className="space-y-2">
                      <div className="text-xl md:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                        Reading detected but unit could not be confirmed.
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Detected reading:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {result.source?.rawText || result.source?.value || "N/A"}
                        </strong>{" "}
                        (Unit Unknown). Not assumed to be KM.
                      </p>
                    </div>
                  ) : result.status === "NO_ODOMETER_DETECTED" ? (
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-bold tracking-tight text-slate-700 dark:text-slate-300">
                        NO ODOMETER DETECTED
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No vehicle odometer was detected in this image. Please capture a clear photo of the dashboard cluster.
                      </p>
                    </div>
                  ) : result.status === "MULTIPLE_ODOMETERS_DETECTED" ? (
                    <div className="space-y-2">
                      <div className="text-2xl md:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                        MULTIPLE DASHBOARDS DETECTED
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Multiple conflicting odometer displays were detected. Please capture an image of a single vehicle dashboard.
                      </p>
                    </div>
                  ) : result.status === "REVIEW_RECOMMENDED" && result.normalized?.value != null ? (
                    <div>
                      <div className="text-4xl md:text-5xl font-extrabold tracking-tight font-mono text-amber-600 dark:text-amber-400">
                        {result.normalized.value.toLocaleString("en-IN")} KM
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                        {result.reviewReason || "Moderate clarity. Please verify digits before saving."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-2xl md:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                        IMAGE UNCLEAR / RETAKE REQUIRED
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {result.message ||
                          result.reviewReason ||
                          "The odometer reading is not clearly readable or the photo was taken from too far. Please capture a clear, closeup photo of the odometer display."}
                      </p>
                      <Button
                        onClick={() => startCamera()}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                      >
                        <Camera className="w-3.5 h-3.5 mr-2" />
                        Retake with Live Camera
                      </Button>
                    </div>
                  )}
                </div>

                {/* METADATA PILLS */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Display Type</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {formatDisplayType(result.displayType)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Confidence</p>
                    <p
                      className={`font-medium mt-0.5 ${
                        result.status === "VERIFIED" && (result.confidence?.reading ?? 0) >= 0.85
                          ? "text-emerald-600 dark:text-emerald-400"
                          : result.status === "REVIEW_RECOMMENDED" && (result.confidence?.reading ?? 0) >= 0.6
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {result.status === "VERIFIED" &&
                      typeof result.confidence?.reading === "number" &&
                      result.confidence.reading > 0
                        ? `${Math.round(result.confidence.reading * 100)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 col-span-2 md:col-span-1">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Latency</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {result.latencyMs ? `${(result.latencyMs / 1000).toFixed(2)}s` : "< 2s"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ERP COMPARISON VALIDATION (IF PREVIOUS KM WAS GIVEN) */}
              {result.erpValidation && (
                <div
                  className={`p-5 rounded-2xl border backdrop-blur-sm ${
                    result.erpValidation.status === "PASS"
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        result.erpValidation.status === "PASS"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                          ERP History Validation
                        </h4>
                        <span
                          className={`text-xs font-semibold ${
                            result.erpValidation.status === "PASS"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {result.erpValidation.status === "PASS" ? "Consistent (+)" : "Discrepancy"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {result.erpValidation.message}
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Previous: </span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {result.erpValidation.previousReading.toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Current: </span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {result.erpValidation.currentReading.toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Difference: </span>
                          <strong className="text-blue-600 dark:text-blue-400">
                            +{result.erpValidation.difference.toLocaleString("en-IN")}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EMPTY / INITIAL STATE GUIDE */}
          {!result && !loading && !errorMessage && (
            <div className="p-6 md:p-8 bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl space-y-6">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Live Vision Scanner Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Instant Live Capture</p>
                  <p className="text-[11px] text-slate-500">
                    Use device camera with instant reticle alignment & 1-tap capture analysis.
                  </p>
                </div>
                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Mechanical Rollers</p>
                  <p className="text-[11px] text-slate-500">
                    Extracts rolling numerical digits and detects colored decimal/tenth units.
                  </p>
                </div>
                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Digital LCD & Clusters</p>
                  <p className="text-[11px] text-slate-500">
                    Parses 7-segment and TFT digital screens, isolating cumulative distance.
                  </p>
                </div>
                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Trip & Speed Rejection</p>
                  <p className="text-[11px] text-slate-500">
                    Strictly isolates Trip A/B, km/h speeds, and clocks from the main mileage.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

