import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ChatInterfaceProps {
  connectionId: string;
  deviceId: string;
  recipientDeviceId: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_device_id: string;
  created_at: string;
}

export default function ChatInterface({ connectionId, deviceId, recipientDeviceId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('shared_content')
          .select('*')
          .eq('connection_id', connectionId)
          .eq('content_type', 'text')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error("Failed to load messages");
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_content',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !recipientDeviceId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('shared_content')
        .insert({
          connection_id: connectionId,
          content: newMessage.trim(),
          content_type: 'text',
          sender_device_id: deviceId,
          recipient_device_id: recipientDeviceId,
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/50 rounded-xl shadow-neo-inner">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_device_id === deviceId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-4 rounded-xl shadow-neo-sm ${
                message.sender_device_id === deviceId
                  ? 'bg-neo-accent text-white ml-12'
                  : 'bg-white text-neo-text mr-12'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/50 shadow-neo-inner focus:outline-none focus:ring-2 focus:ring-neo-accent/50 text-neo-text placeholder:text-neo-text/50"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !newMessage.trim()}
          className="bg-neo-accent text-white p-3 rounded-xl shadow-neo-sm hover:shadow-neo active:shadow-neo-inner transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
