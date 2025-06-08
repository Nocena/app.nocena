// src/lib/utils/notificationHelpers.ts

/**
 * Helper functions for sending push notifications throughout the app
 */

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send a push notification to a single user
 */
export async function sendPushNotificationToUser(userId: string, notification: NotificationOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        notification: {
          ...notification,
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: notification.badge || '/icons/icon-192x192.png',
        },
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send a push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  notification: NotificationOptions,
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds,
        notification: {
          ...notification,
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: notification.badge || '/icons/icon-192x192.png',
        },
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return false;
  }
}

/**
 * Send daily challenge notification to a user
 */
export async function sendDailyChallengeNotification(userId: string, challengeTitle: string): Promise<boolean> {
  return sendPushNotificationToUser(userId, {
    title: '🎯 New Daily Challenge!',
    body: challengeTitle,
    url: '/home',
    data: {
      type: 'daily-challenge',
      challengeTitle,
    },
    actions: [
      {
        action: 'open',
        title: 'Start Challenge',
      },
    ],
  });
}

/**
 * Send follow notification to a user
 */
export async function sendFollowNotification(targetUserId: string, followerUsername: string): Promise<boolean> {
  return sendPushNotificationToUser(targetUserId, {
    title: '👥 New Follower!',
    body: `${followerUsername} started following you`,
    url: '/profile',
    data: {
      type: 'new-follower',
      followerUsername,
    },
    actions: [
      {
        action: 'open',
        title: 'View Profile',
      },
    ],
  });
}

/**
 * Send private challenge notification to a user
 */
export async function sendPrivateChallengeNotification(
  targetUserId: string,
  challengerUsername: string,
  challengeTitle: string,
): Promise<boolean> {
  return sendPushNotificationToUser(targetUserId, {
    title: "🏆 You've Been Challenged!",
    body: `${challengerUsername}: ${challengeTitle}`,
    url: '/inbox',
    data: {
      type: 'private-challenge',
      challengerUsername,
      challengeTitle,
    },
    actions: [
      {
        action: 'open',
        title: 'View Challenge',
      },
    ],
  });
}

/**
 * Send challenge completion notification to followers
 */
export async function sendChallengeCompletionNotification(
  followerIds: string[],
  username: string,
  challengeTitle: string,
): Promise<boolean> {
  if (followerIds.length === 0) return true;

  return sendPushNotificationToUsers(followerIds, {
    title: '🎉 Friend Completed Challenge!',
    body: `${username} just completed: ${challengeTitle}`,
    url: '/home',
    data: {
      type: 'challenge-completion',
      username,
      challengeTitle,
    },
    actions: [
      {
        action: 'open',
        title: 'View Feed',
      },
    ],
  });
}

/**
 * Send weekly reminder notification
 */
export async function sendWeeklyReminderNotification(
  userIds: string[],
  completedChallenges: number,
  totalChallenges: number,
): Promise<boolean> {
  if (userIds.length === 0) return true;

  const percentage = Math.round((completedChallenges / totalChallenges) * 100);

  return sendPushNotificationToUsers(userIds, {
    title: '📊 Weekly Progress Update',
    body: `You completed ${completedChallenges}/${totalChallenges} challenges this week (${percentage}%)`,
    url: '/profile',
    data: {
      type: 'weekly-reminder',
      completedChallenges,
      totalChallenges,
      percentage,
    },
    actions: [
      {
        action: 'open',
        title: 'View Progress',
      },
    ],
  });
}

/**
 * Send streak milestone notification
 */
export async function sendStreakMilestoneNotification(userId: string, streakDays: number): Promise<boolean> {
  const getStreakMessage = (days: number): string => {
    if (days === 7) return 'One week streak! 🔥';
    if (days === 30) return 'One month streak! 🔥🔥';
    if (days === 100) return '100 day streak! 🔥🔥🔥';
    if (days % 10 === 0) return `${days} day streak! Keep it up! 🔥`;
    return `${days} day streak! Amazing! 🔥`;
  };

  return sendPushNotificationToUser(userId, {
    title: '🔥 Streak Milestone!',
    body: getStreakMessage(streakDays),
    url: '/profile',
    data: {
      type: 'streak-milestone',
      streakDays,
    },
    actions: [
      {
        action: 'open',
        title: 'View Profile',
      },
    ],
  });
}

/**
 * Send token reward notification
 */
export async function sendTokenRewardNotification(
  userId: string,
  tokensEarned: number,
  reason: string,
): Promise<boolean> {
  return sendPushNotificationToUser(userId, {
    title: '💰 Tokens Earned!',
    body: `You earned ${tokensEarned} tokens for ${reason}`,
    url: '/profile',
    data: {
      type: 'token-reward',
      tokensEarned,
      reason,
    },
    actions: [
      {
        action: 'open',
        title: 'View Wallet',
      },
    ],
  });
}
