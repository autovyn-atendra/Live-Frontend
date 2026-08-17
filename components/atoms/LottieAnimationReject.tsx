import { useEffect } from "react";

const LottieAnimationReject = () => {
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
        src="https://lottie.host/49a45ba4-47b9-4266-918b-4fa71733b509/3aEnXmqOWp.json"
        background="transparent"
        speed="0.8"
        style={{ width: "200px", height: "200px" }}
        loop
        autoplay
      ></dotlottie-player>
    </div>
  );
};

export default LottieAnimationReject;

