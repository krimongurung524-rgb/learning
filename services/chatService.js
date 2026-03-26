import { Chat, User, Notification } from '../models/index.js';
import { Op } from 'sequelize';

export const getChatHistory = async (currentUserId, userId) => {
  const messages = await Chat.findAll({
    where: {
      [Op.or]: [
        { sender_id: currentUserId, receiver_id: userId },
        { sender_id: userId, receiver_id: currentUserId },
      ],
    },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'name', 'role'] },
      { model: User, as: 'receiver', attributes: ['id', 'name', 'role'] },
    ],
    order: [['created_at', 'ASC']],
  });

  // Mark messages as read
  await Chat.update(
    { is_read: true },
    { where: { sender_id: userId, receiver_id: currentUserId, is_read: false } }
  );

  return messages;
};

export const sendMessage = async (currentUserId, currentUserName, receiver_id, message) => {
  const chat = await Chat.create({ sender_id: currentUserId, receiver_id, message });
  const fullChat = await Chat.findByPk(chat.id, {
    include: [
      { model: User, as: 'sender', attributes: ['id', 'name', 'role'] },
      { model: User, as: 'receiver', attributes: ['id', 'name', 'role'] },
    ],
  });

  // Create notification
  await Notification.create({
    user_id: receiver_id,
    title: 'New Message',
    message: `${currentUserName}: ${message.substring(0, 50)}`,
    type: 'chat',
    link: '/chat',
  });

  return fullChat;
};

export const getConversations = async (userId) => {
  const conversations = await Chat.findAll({
    where: {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'name', 'role'] },
      { model: User, as: 'receiver', attributes: ['id', 'name', 'role'] },
    ],
    order: [['created_at', 'DESC']],
  });

  const userMap = new Map();
  conversations.forEach(chat => {
    const otherUser = chat.sender_id === userId ? chat.receiver : chat.sender;
    if (!userMap.has(otherUser.id)) {
      userMap.set(otherUser.id, {
        user: otherUser,
        lastMessage: chat.message,
        lastTime: chat.created_at,
        unread: 0,
      });
    }
    if (!chat.is_read && chat.receiver_id === userId) {
      const existing = userMap.get(otherUser.id);
      existing.unread += 1;
    }
  });

  return Array.from(userMap.values());
};

export const getUnreadCount = async (userId) => {
  const count = await Chat.count({
    where: { receiver_id: userId, is_read: false },
  });
  return count;
};

export default {
  getChatHistory,
  sendMessage,
  getConversations,
  getUnreadCount,
};
