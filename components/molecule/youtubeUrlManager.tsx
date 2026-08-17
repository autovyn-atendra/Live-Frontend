import { useState, useEffect } from "react";
import axios from "axios";
import { env } from "process";
import { Button } from "../ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";

const YoutubeUrlManager = ({ Erp_Url, fetchData }) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [savedPdf, setSavedPdf] = useState({});
  const user = useCurrentUser();

  const handleSaveUrl = async () => {
    if (!youtubeUrl.trim()) return alert("Please enter a valid URL");

    try {
      const result = await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/SaveYoutubeUrl`,
        {
          Erp_Url: Erp_Url?.join('/'), YoutubeUrl: youtubeUrl
        },
        {
          headers: {
            compcode: user?.Comp_Code,name:user?.name,
          },
        }
      );
      setYoutubeUrl("");
      setSavedUrl("Url Added Successfully");
      fetchData();
      setTimeout(() => {
        setSavedUrl("");
      }, 2000);
      // Clear input after saving
    } catch (error) {
      console.error("Error saving URL:", error);
      alert("Failed to save URL");
    }
  };
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSavedPdf((prevData) => ({
      Image: file,
    }));
  };
  const UploadPhoto = async () => {
    if (!savedPdf) {
      alert("please Upload file first")
    }

    const validFormats = ["pdf"];
    const fileExtension = savedPdf.Image.name.split(".").pop().toLowerCase();

    if (!validFormats.includes(fileExtension)) {
      alert("please select correct format pdf")
      return;
    }

    try {
      const formdata1 = new FormData();
      formdata1.append("URL", Erp_Url[Erp_Url.length - 1]);
      formdata1.append("Image", savedPdf.Image);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/UploadHelpPdf`,
        formdata1,
        {
          headers: {
            compcode: user?.Comp_Code,name:user?.name,
          },
        }
      );
      setSavedUrl("File Added Successfully");
      setTimeout(() => {
        setSavedUrl("");
      }, 2000);
    } catch (error) {
      console.log(error);
    } finally {
      document.getElementById("imageInput").value = "";
      setSavedPdf({});
    }
  };
  return (
    <div className="max-w-lg mx-auto dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900  mb-4">Add YouTube Video</h2>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter YouTube Video URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="border p-2 rounded-md w-full"
        />
        <Button
          onClick={handleSaveUrl}
          className=""
          variant={"outline"}
        >
          Save URL
        </Button>
        <input
          type="file"
          id="imageInput"
          title="upload image"
          name="uploadDoc"
          onChange={(event) => handleFileChange(event)}
          className="flex h-9 w-full ring-1 pt-2 rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
        />
        <Button variant={"save"} onClick={UploadPhoto}>
          Upload Document
        </Button>
        <strong className="text-green">{savedUrl}</strong>
      </div>
    </div>
  );
};

export default YoutubeUrlManager;
