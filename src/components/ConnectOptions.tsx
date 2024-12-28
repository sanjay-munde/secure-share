import { useState, useEffect } from "react";
import { QrCode, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConnectOptionsProps {
  connectionId: string;
  deviceId: string;
  isConnecting: boolean;
  onInitConnection: () => void;
  onConnected: () => void;
}

export default function ConnectOptions({ 
  connectionId, 
  deviceId, 
  isConnecting, 
  onInitConnection,
  onConnected
}: ConnectOptionsProps) {
  const [showQR, setShowQR] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [generatedPin, setGeneratedPin] = useState("");
  const [showGeneratedPin, setShowGeneratedPin] = useState(false);

  // Generate a random 4-digit PIN
  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPin(pin);
    return pin;
  };

  // Generate the connection URL that will be encoded in the QR code
  const getConnectionUrl = () => {
    const baseUrl = window.location.origin;
    const connectionUrl = new URL(baseUrl);
    connectionUrl.searchParams.set("connectionId", connectionId);
    connectionUrl.searchParams.set("hostDeviceId", deviceId);
    connectionUrl.searchParams.set("action", "connect");
    return connectionUrl.toString();
  };

  const handleGeneratePin = async () => {
    setShowGeneratedPin(true);
    setShowQR(false);
    onInitConnection();
    const pin = generatePin();
    
    try {
      const { error } = await supabase
        .from('device_connections')
        .update({ pin_code: pin })
        .eq('connection_id', connectionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving PIN:', error);
      toast.error("Failed to generate PIN");
    }
  };

  const handleConnectWithPin = async () => {
    if (pinCode.length !== 4) return;

    try {
      const { data, error } = await supabase
        .from('device_connections')
        .select('connection_id, host_device_id')
        .eq('pin_code', pinCode)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Invalid PIN code");
        return;
      }

      const { error: updateError } = await supabase
        .from('device_connections')
        .update({
          guest_device_id: deviceId,
          status: 'connected',
          pin_code: null // Clear the PIN after successful connection
        })
        .eq('connection_id', data.connection_id);

      if (updateError) throw updateError;
      
      onConnected();
      toast.success("Connected successfully!");
    } catch (error) {
      console.error('Error connecting with PIN:', error);
      toast.error("Failed to connect with PIN");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            onInitConnection();
            setShowQR(true);
            setShowGeneratedPin(false);
          }}
          disabled={isConnecting}
          className="bg-neo-bg shadow-neo-sm hover:shadow-neo active:shadow-neo-inner px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-neo-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              QR Code
            </>
          )}
        </button>

        <button
          onClick={handleGeneratePin}
          disabled={isConnecting}
          className="bg-neo-bg shadow-neo-sm hover:shadow-neo active:shadow-neo-inner px-6 py-3 rounded-xl transition-all duration-200 text-neo-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate PIN
        </button>
      </div>

      {showGeneratedPin && generatedPin && (
        <div className="bg-white/50 p-6 rounded-xl shadow-neo-sm space-y-2">
          <p className="text-neo-text/70 text-center">Share this PIN with the other device:</p>
          <p className="text-3xl font-bold tracking-wider text-neo-accent text-center">{generatedPin}</p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={4}
          placeholder="Enter 4-digit PIN"
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="flex-1 px-4 py-3 rounded-xl bg-white/50 shadow-neo-inner focus:outline-none focus:ring-2 focus:ring-neo-accent/50 text-neo-text placeholder:text-neo-text/50"
        />
        <button
          onClick={handleConnectWithPin}
          disabled={pinCode.length !== 4}
          className="bg-neo-accent text-white px-6 py-3 rounded-xl shadow-neo-sm hover:shadow-neo active:shadow-neo-inner transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect
        </button>
      </div>

      {showQR && connectionId && (
        <div className="flex justify-center">
          <div className="bg-white/50 p-8 rounded-xl shadow-neo-sm">
            <QRCodeSVG 
              value={getConnectionUrl()}
              size={200}
              level="H"
              className="mx-auto"
            />
            <p className="text-neo-text/70 mt-4 text-center">
              Scan with another device to connect
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
