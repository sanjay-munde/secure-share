import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import ConnectionStatus from "./ConnectionStatus";
import ConnectOptions from "./ConnectOptions";

export default function ShareCard() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [connectionId, setConnectionId] = useState("");
  const [deviceId] = useState(nanoid());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check URL parameters for connection info
    const urlParams = new URLSearchParams(window.location.search);
    const urlConnectionId = urlParams.get('connectionId');
    const hostDeviceId = urlParams.get('hostDeviceId');
    const action = urlParams.get('action');

    // If this is a connection request from QR code
    if (urlConnectionId && hostDeviceId && action === 'connect') {
      handleQrConnection(urlConnectionId, hostDeviceId);
      // Clean up URL after processing
      window.history.replaceState({}, '', window.location.pathname);
    } else if (!connectionId) {
      setConnectionId(nanoid());
    }
  }, []);

  const handleQrConnection = async (urlConnectionId: string, hostDeviceId: string) => {
    setIsConnecting(true);
    setConnectionId(urlConnectionId);

    try {
      const { error } = await supabase
        .from('device_connections')
        .update({
          guest_device_id: deviceId,
          status: 'connected'
        })
        .eq('connection_id', urlConnectionId)
        .eq('host_device_id', hostDeviceId);

      if (error) throw error;
      
      setIsConnected(true);
      toast.success("Connected successfully!");
    } catch (error) {
      console.error('Error connecting via QR:', error);
      toast.error("Failed to connect. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!connectionId) return;

    const channel = supabase
      .channel('device-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_connections',
          filter: `connection_id=eq.${connectionId}`,
        },
        async (payload: any) => {
          if (payload.new.status === 'connected') {
            setIsConnected(true);
            setIsConnecting(false);
            toast.success("Device connected successfully!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

  useEffect(() => {
    if (!connectionId) return;

    const channel = supabase
      .channel('shared-content')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_content',
          filter: `recipient_device_id=eq.${deviceId}`,
        },
        async (payload: any) => {
          if (payload.new.content_type === 'text') {
            setText(payload.new.content);
            toast.success("New text received!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initializeConnection = async () => {
    setIsConnecting(true);
    try {
      const { error } = await supabase
        .from('device_connections')
        .insert({
          connection_id: connectionId,
          host_device_id: deviceId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating connection:', error);
      toast.error("Failed to initialize connection");
      setIsConnecting(false);
    }
  };

  const handleShare = async () => {
    if (!text || !isConnected) return;

    try {
      const { data: connections } = await supabase
        .from('device_connections')
        .select('guest_device_id')
        .eq('connection_id', connectionId)
        .single();

      if (!connections?.guest_device_id) {
        toast.error("No connected device found");
        return;
      }

      const { error } = await supabase
        .from('shared_content')
        .insert({
          connection_id: connectionId,
          content_type: 'text',
          content: text,
          sender_device_id: deviceId,
          recipient_device_id: connections.guest_device_id,
        });

      if (error) throw error;
      toast.success("Text shared successfully!");
    } catch (error) {
      console.error('Error sharing text:', error);
      toast.error("Failed to share text");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Share Securely
        </h2>
        <p className="text-gray-500">
          Connect devices and share text securely in real-time.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
            Text to Share
          </label>
          <input
            id="text-input"
            type="text"
            placeholder="Enter text to share..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <ConnectOptions
          connectionId={connectionId}
          deviceId={deviceId}
          isConnecting={isConnecting}
          onInitConnection={initializeConnection}
        />

        <ConnectionStatus
          isConnected={isConnected}
          isConnecting={isConnecting}
        />

        <button
          onClick={handleShare}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text || !isConnected}
        >
          {copied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
          Share Text
        </button>
      </div>

      <div className="text-sm text-gray-500">
        <h3 className="font-medium text-gray-700 mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "QR Code" to generate a connection code</li>
          <li>Scan the QR code with another device to connect automatically</li>
          <li>Once connected, enter text and click "Share Text"</li>
          <li>The text will appear on the connected device instantly</li>
        </ol>
      </div>
    </div>
  );
}
