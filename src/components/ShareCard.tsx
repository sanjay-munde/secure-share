import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import ConnectionStatus from "./ConnectionStatus";
import ConnectOptions from "./ConnectOptions";
import ChatInterface from "./ChatInterface";

export default function ShareCard() {
  const [connectionId, setConnectionId] = useState("");
  const [deviceId] = useState(nanoid());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [recipientDeviceId, setRecipientDeviceId] = useState<string | null>(null);

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
      setRecipientDeviceId(hostDeviceId);
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
            setRecipientDeviceId(payload.new.guest_device_id === deviceId 
              ? payload.new.host_device_id 
              : payload.new.guest_device_id);
            toast.success("Device connected successfully!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId]);

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

      {!isConnected ? (
        <ConnectOptions
          connectionId={connectionId}
          deviceId={deviceId}
          isConnecting={isConnecting}
          onInitConnection={initializeConnection}
          onConnected={() => setIsConnected(true)}
        />
      ) : (
        <ChatInterface
          connectionId={connectionId}
          deviceId={deviceId}
          recipientDeviceId={recipientDeviceId}
        />
      )}

      <ConnectionStatus
        isConnected={isConnected}
        isConnecting={isConnecting}
      />

      {!isConnected && (
        <div className="text-sm text-gray-500">
          <h3 className="font-medium text-gray-700 mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "QR Code" to scan with another device</li>
            <li>Or generate a PIN code to share manually</li>
            <li>Once connected, you can start chatting</li>
            <li>Messages are delivered instantly and securely</li>
          </ol>
        </div>
      )}
    </div>
  );
}