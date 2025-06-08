// src/pages/api/notifications/send-push.ts

import { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!, // This should be in your .env.local, not public
);

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  url?: string;
}

interface SendPushRequest {
  userId?: string;
  userIds?: string[];
  subscription?: string;
  subscriptions?: string[];
  notification: PushNotificationPayload;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, userIds, subscription, subscriptions, notification }: SendPushRequest = req.body;

    if (!notification || !notification.title || !notification.body) {
      return res.status(400).json({ error: 'Notification title and body are required' });
    }

    const targetSubscriptions: string[] = [];

    // If specific subscriptions are provided, use those
    if (subscription) {
      targetSubscriptions.push(subscription);
    }
    if (subscriptions && subscriptions.length > 0) {
      targetSubscriptions.push(...subscriptions);
    }

    // If user IDs are provided, fetch their subscriptions from the database
    if (userId || (userIds && userIds.length > 0)) {
      const userIdsToQuery = userId ? [userId] : userIds!;

      const query = `
        query GetUserSubscriptions($userIds: [String!]) {
          queryUser(filter: { id: { in: $userIds } }) {
            id
            pushSubscription
          }
        }
      `;

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_DGRAPH_API_KEY && {
            'X-Auth-Token': process.env.NEXT_PUBLIC_DGRAPH_API_KEY,
          }),
        },
        body: JSON.stringify({
          query,
          variables: { userIds: userIdsToQuery },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error('Error fetching user subscriptions:', data.errors);
        return res.status(500).json({ error: 'Failed to fetch user subscriptions' });
      }

      const users = data.data?.queryUser || [];
      const userSubscriptions = users
        .filter((user: any) => user.pushSubscription)
        .map((user: any) => user.pushSubscription);

      targetSubscriptions.push(...userSubscriptions);
    }

    if (targetSubscriptions.length === 0) {
      return res.status(400).json({ error: 'No valid push subscriptions found' });
    }

    // Prepare the notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-192x192.png',
      data: {
        url: notification.url || '/home',
        ...notification.data,
      },
      actions: notification.actions || [
        {
          action: 'open',
          title: 'Open App',
        },
      ],
    });

    const results = [];
    const errors = [];

    // Send notifications to all subscriptions
    for (const subscriptionString of targetSubscriptions) {
      try {
        const subscriptionObject = JSON.parse(subscriptionString);
        await webpush.sendNotification(subscriptionObject, payload);
        results.push({ subscription: subscriptionString.substring(0, 50) + '...', success: true });
      } catch (error) {
        console.error('Error sending push notification:', error);
        errors.push({
          subscription: subscriptionString.substring(0, 50) + '...',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // If the subscription is invalid (410 Gone), you might want to remove it from the database
        if (error instanceof Error && error.message.includes('410')) {
          // TODO: Implement subscription cleanup
          console.log('Invalid subscription detected, should be removed from database');
        }
      }
    }

    return res.status(200).json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Error in send-push API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Helper function to send daily challenge notifications
export async function sendDailyChallengeNotification(userIds: string[], challengeTitle: string) {
  try {
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds,
        notification: {
          title: '🎯 New Daily Challenge!',
          body: challengeTitle,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
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
        },
      }),
    });

    const result = await response.json();
    console.log('Daily challenge notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending daily challenge notification:', error);
    throw error;
  }
}

// Helper function to send follow notifications
export async function sendFollowNotification(targetUserId: string, followerUsername: string) {
  try {
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: targetUserId,
        notification: {
          title: '👥 New Follower!',
          body: `${followerUsername} started following you`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
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
        },
      }),
    });

    const result = await response.json();
    console.log('Follow notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending follow notification:', error);
    throw error;
  }
}

// Helper function to send private challenge notifications
export async function sendPrivateChallengeNotification(
  targetUserId: string,
  challengerUsername: string,
  challengeTitle: string,
) {
  try {
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: targetUserId,
        notification: {
          title: "🏆 You've Been Challenged!",
          body: `${challengerUsername}: ${challengeTitle}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
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
        },
      }),
    });

    const result = await response.json();
    console.log('Private challenge notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending private challenge notification:', error);
    throw error;
  }
}
