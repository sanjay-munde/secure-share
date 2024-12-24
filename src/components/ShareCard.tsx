import { useState, useEffect } from "react";
import { QrCode, Copy, Check, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export default function ShareCard() {
  const [text, setText] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectionId, setConnectionId] = useState("");
  const [deviceId] = useState(nanoid());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!connectionId) {
      setConnectionId(nanoid());
    }
  }, []);

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
        async (payload) => {
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
        async (payload) => {
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
      setShowQR(true);
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
    <div className="apple-card space-y-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-foreground">
        Share Securely
      </h2>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Enter text to share..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="apple-input"
        />
        
        <div className="flex gap-4">
          {!showQR ? (
            <button
              onClick={initializeConnection}
              disabled={isConnecting}
              className="apple-button-secondary flex items-center gap-2 w-full justify-center"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Connect Device
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowQR(false)}
              className="apple-button-secondary flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Hide QR
            </button>
          )}
          
          <button
            onClick={handleShare}
            className="apple-button flex items-center gap-2"
            disabled={!text || !isConnected}
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            Share
          </button>
        </div>
      </div>

      {showQR && connectionId && (
        <div className="flex justify-center pt-4">
          <div className="apple-card bg-white p-4">
            <QRCodeSVG 
              value={JSON.stringify({
                connectionId,
                hostDeviceId: deviceId,
                type: 'connection'
              })}
              size={200}
              level="H"
              className="mx-auto"
            />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Scan with another device to connect
            </p>
          </div>
        </div>
      )}

      {isConnected && (
        <div className="text-sm text-green-600 text-center">
          Device connected successfully! You can now share text.
        </div>
      )}
    </div>
  );
}