import React from "react";
import LoadingState from "./ui/LoadingState";
import { themes } from "@/constants/themes";

interface AuthLoadingScreenProps {
  className?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-center min-h-screen ${themes.chatview.backdrop} ${className}`}
    >
      <LoadingState
        message={""}
        size="lg"
        centerContent={true}
      />
    </div>
  );
};

export default AuthLoadingScreen;
