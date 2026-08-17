import { useEffect } from "react";

const LottieAnimationpending = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
    script.type = "module";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="mt-0">
      <dotlottie-player
        src="https://lottie.host/9c87a414-74a4-4e99-9c06-6b2f39a191d0/pfOU6srSbL.json"
        background="transparent"
        speed="0.8"
        style={{ width: "200px", height: "200px" }}
        loop
        autoplay
      ></dotlottie-player>
    </div>
  );
};

export default LottieAnimationpending;
