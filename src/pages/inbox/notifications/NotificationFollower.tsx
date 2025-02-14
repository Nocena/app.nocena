import React from "react";
import Image from "next/image";
import ThematicText from "../../../components/ui/ThematicText";
import ThematicImage from "../../../components/ui/ThematicImage";

interface NotificationFollowerProps {
  username: string;
  profilePicture: string;
}

const NotificationFollower: React.FC<NotificationFollowerProps> = ({ username, profilePicture }) => {
  return (
    <div className="relative flex items-center justify-between p-4 rounded-[15px] bg-white/10 backdrop-blur-md shadow-md w-full max-w-lg overflow-hidden">
      {/* Background Ellipse */}
      <div className="absolute top-1/2 left-[70%] w-[80%] h-[80%] transform -translate-x-1/2 -translate-y-1/2 rounded-full z-0"
        style={{
          background: "radial-gradient(circle, rgba(0, 123, 255, 0.5) 0%, rgba(0, 123, 255, 0) 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Content Layer */}
      <span className="text-white text-md font-light">New follower!</span>

      {/* Username & Profile */}
      <div className="flex items-center space-x-3">
        <ThematicText text={username} isActive={true} className="capitalize" />
        <ThematicImage className="rounded-full">
          <Image src={profilePicture} alt="User Profile" width={40} height={40} className="w-10 h-10 object-cover rounded-full overflow-hidden" />
        </ThematicImage>
      </div>
    </div>
  );
};

export default NotificationFollower;
