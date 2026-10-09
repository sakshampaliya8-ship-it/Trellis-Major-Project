"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

import { BACKEND_URL } from "@/config/api";

function ChatContent() {
  const searchParams = useSearchParams();
  const recipientParam = searchParams.get("recipient");

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Chat Data States
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("trellis_token");
    const savedRole = localStorage.getItem("trellis_role");
    const savedEmail = localStorage.getItem("trellis_email");
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUserRole(savedRole);
      fetchUserProfile(savedToken, savedEmail);
    }
  }, []);

  const fetchUserProfile = async (tk: string, email: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/profile/${email}`, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setUserId(data.profile.user?._id || data.profile.user);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  // Socket Connection setup
  useEffect(() => {
    if (!token || !userId) return;

    const socket = io(BACKEND_URL, {
      query: { token }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected on client:", socket.id);
      socket.emit("join:user", userId);
    });

    socket.on("message:new", (newMsg: any) => {
      // Append if it's the active conversation
      if (activeConv && newMsg.conversationId === activeConv._id) {
        setMessages((prev) => [...prev, newMsg]);
        // Acknowledge read status
        markConversationAsRead(activeConv._id);
      }
      fetchConversations(token);
    });

    socket.on("conversation:updated", () => {
      fetchConversations(token);
    });

    socket.on("message:read", ({ conversationId, readerId }: any) => {
      if (activeConv && conversationId === activeConv._id && readerId !== userId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === userId ? { ...m, isRead: true } : m))
        );
      }
    });

    fetchConversations(token);

    return () => {
      socket.disconnect();
    };
  }, [token, userId, activeConv?._id]);

  // Handle direct navigation chat shortcut
  useEffect(() => {
    if (token && userId && recipientParam) {
      handleInitiateRecipientChat(recipientParam);
    }
  }, [token, userId, recipientParam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async (tk: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${tk}` }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const loadConversationMessages = async (convId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conv: any) => {
    if (activeConv && socketRef.current) {
      socketRef.current.emit("leave:conversation", activeConv._id);
    }
    setActiveConv(conv);
    if (socketRef.current) {
      socketRef.current.emit("join:conversation", conv._id);
    }
    loadConversationMessages(conv._id);
    markConversationAsRead(conv._id);
  };

  const markConversationAsRead = async (convId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/chat/conversations/${convId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const textToSend = inputText;
    setInputText("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/conversations/${activeConv._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await response.json();
      if (data.success) {
        // Optimistic socket updates already append the message via socket listener, but fallback if socket not open:
        if (!socketRef.current?.connected) {
          setMessages((prev) => [...prev, data.message]);
        }
      }
    } catch (err) {
      alert("Error sending message.");
    }
  };

  const handleInitiateRecipientChat = async (recId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: recId })
      });
      const data = await response.json();
      if (data.success && data.conversation) {
        // Check if conversation already in list
        const exists = conversations.find((c) => c._id === data.conversation._id);
        if (!exists) {
          setConversations((prev) => [data.conversation, ...prev]);
        }
        handleSelectConversation(data.conversation);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = (conv: any) => {
    return conv.participants?.find((p: any) => p._id !== userId) || { name: "Campus Colleague", photoUrl: "" };
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm flex h-[75vh]">
        {/* Left Panel: Conversation List */}
        <div className="w-80 border-r border-zinc-150 flex flex-col">
          <div className="p-4 border-b border-zinc-150 shrink-0">
            <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider">Inbox Conversations</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Select a colleague to start chatting.</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {conversations.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-10">No chats yet.</p>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConv?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 flex gap-3 items-center cursor-pointer hover:bg-zinc-50 transition-colors ${isActive ? "bg-emerald-50/40" : ""
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center font-bold text-emerald-850">
                      {other.photoUrl ? (
                        <img src={other.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        other.name[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-extrabold text-zinc-950 truncate">{other.name}</h4>
                        <span className="text-[9px] text-zinc-400">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {conv.lastMessage ? conv.lastMessage.message : "No messages yet."}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Messaging Window */}
        <div className="flex-1 flex flex-col bg-zinc-50/50">
          {activeConv ? (
            <>
              {/* Header bar */}
              <div className="p-4 border-b border-zinc-150 bg-white flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-full bg-zinc-200 overflow-hidden flex items-center justify-center font-bold text-emerald-800">
                  {getOtherParticipant(activeConv).photoUrl ? (
                    <img src={getOtherParticipant(activeConv).photoUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    getOtherParticipant(activeConv).name[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-950">{getOtherParticipant(activeConv).name}</h4>
                  <span className="text-[9px] text-emerald-800 bg-emerald-50 rounded px-1.5 py-0.5 uppercase font-bold">
                    {getOtherParticipant(activeConv).role}
                  </span>
                </div>
              </div>

              {/* Messages Grid */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="text-center text-xs text-zinc-400 py-10">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-zinc-400 py-10">No messages in this chat. Start the conversation!</div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === userId;
                    return (
                      <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-md rounded-2xl p-3 text-xs shadow-sm ${isMine
                              ? "bg-emerald-600 text-white rounded-br-none"
                              : "bg-white text-zinc-800 border border-zinc-100 rounded-bl-none"
                            }`}
                        >
                          <p className="leading-relaxed break-words">{m.message}</p>
                          <div className="flex justify-end items-center gap-1 mt-1 text-[9px] opacity-70">
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {isMine && (
                              <span>{m.isRead ? "✓✓" : "✓"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form Footer */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-150 flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Type a secure message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-650 text-zinc-800"
                />
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-zinc-400">
              <span className="text-4xl mb-2">💬</span>
              <p className="text-xs italic">Select a conversation or open a student profile card to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col justify-center items-center text-zinc-400 min-h-screen">
        <span className="text-4xl mb-2 animate-bounce">💬</span>
        <p className="text-xs italic">Loading chat module...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
