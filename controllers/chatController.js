import * as chatService from '../services/chatService.js';

export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await chatService.getChatHistory(req.user.id, userId);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiver_id, message } = req.body;
    const chat = await chatService.sendMessage(req.user.id, req.user.name, receiver_id, message);
    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await chatService.getUnreadCount(req.user.id);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getChatHistory, sendMessage, getConversations, getUnreadCount };
