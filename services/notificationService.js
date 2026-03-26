import { Notification } from '../models/index.js';

export const getNotifications = async (userId) => {
  const notifications = await Notification.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: 20,
  });
  return notifications;
};

export const markAsRead = async (notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }
  await notification.update({ is_read: true });
  return notification;
};

export const markAllAsRead = async (userId) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );
  return { message: 'All marked as read' };
};

export const deleteNotification = async (notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }
  await notification.destroy();
  return { message: 'Notification deleted' };
};

export const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: { user_id: userId, is_read: false },
  });
  return count;
};

export const createNotification = async (user_id, title, message, type = 'system', link = null) => {
  const notification = await Notification.create({
    user_id,
    title,
    message,
    type,
    link,
  });
  return notification;
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification,
};
