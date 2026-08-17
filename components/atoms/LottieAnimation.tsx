import { useEffect } from "react";

interface LottieAnimationProps {
  width?: string | number;   // optional
  height?: string | number;  // optional
}


const LottieAnimation = ({ width = "200px", height = "200px" }: LottieAnimationProps) => {
  useEffect(() => {
    // Dynamically load the lottie-player script when the component is mounted
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
    script.type = "module";
    document.body.appendChild(script);

    // Clean up the script when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="mt-0">
      <dotlottie-player
        src="https://lottie.host/1942e0a4-e290-4ba0-91b7-2afbc04c61f8/VXk4yHCPpF.json"
        background="transparent"
        speed="0.8"
        style={{ width, height }}
        loop
        autoplay
      ></dotlottie-player>
    </div>
  );
};

export default LottieAnimation;
