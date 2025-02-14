import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../../contexts/AuthContext";
import Image from "next/image";
import ThematicText from "../../../components/ui/ThematicText";
import ThematicImage from "../../../components/ui/ThematicImage";

interface NotificationFollowerProps {
  username: string;
  profilePicture: string;
  id?: string;
}

const NotificationFollower: React.FC<NotificationFollowerProps> = ({ username, profilePicture, id }) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleProfileRedirect = () => {
    if (!id) return;

    if (user?.id === id) {
      router.push("/profile"); 
    } else {
      router.push(`/profile/${id}`);
    }
  };

  return (
    <div 
      className="relative flex items-center justify-between p-4 rounded-[15px] bg-white/10 backdrop-blur-md shadow-md w-full max-w-lg overflow-hidden cursor-pointer hover:bg-white/20 transition"
      onClick={handleProfileRedirect}
    >
      <span className="text-white text-md font-light">New follower!</span>

      <div className="flex items-center space-x-3">
        <ThematicText text={username} isActive={true} className="capitalize" />
        <ThematicImage className="rounded-full">
          <Image src={profilePicture} alt="User Profile" width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
        </ThematicImage>
      </div>
    </div>
  );
};

export default NotificationFollower;