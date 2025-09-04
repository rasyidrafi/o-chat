import React from "react";
import LoadingState from "./ui/LoadingState";

interface AuthLoadingScreenProps {
  className?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-white dark:bg-[#1c1c1c] ${className}`}
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
