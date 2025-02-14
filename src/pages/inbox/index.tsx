import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchNotifications } from "../../utils/api/dgraph";
import NotificationFollower from "./notifications/NotificationFollower";
import NotificationChallenge from "./notifications/NotificationChallenge";

const InboxView = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const fetchedNotifications = await fetchNotifications(user.id);
        console.log(fetchedNotifications);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id]);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 p-6">
      {loading ? (
        <p className="text-gray-400">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-400">No notifications yet.</p>
      ) : (
        notifications.map((notification) =>
          notification.notificationType === "follow" ? (
            <NotificationFollower
              key={notification.id}
              username={notification.triggeredBy?.username ?? "Unknown"}  // ✅ Correct user
              profilePicture={notification.triggeredBy?.profilePicture ?? "/profile.png"}
              id={notification.triggeredBy?.id} // ✅ Pass correct wallet
            />
          ) : (
            <NotificationChallenge
              key={notification.id}
              title={notification.content}
              challengerName={"Unknown"}
              challengerProfile={"/profile.png"}
              reward={10}
            />
          )
        )
      )}
    </div>
  );
};

export default InboxView;