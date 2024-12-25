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
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Connect Devices</h3>
        <p className="text-sm text-gray-500">
          Scan QR code or use a 4-digit code to connect devices
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            onInitConnection();
            setShowQR(true);
            setShowGeneratedPin(false);
          }}
          disabled={isConnecting}
          className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
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
          className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors"
        >
          Generate PIN
        </button>
      </div>

      {showGeneratedPin && generatedPin && (
        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Share this PIN with the other device:</p>
          <p className="text-3xl font-bold tracking-wider text-blue-600">{generatedPin}</p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={4}
          placeholder="Enter 4-digit PIN"
          value={pinCode}
          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <button
          onClick={handleConnectWithPin}
          disabled={pinCode.length !== 4}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect
        </button>
      </div>

      {showQR && connectionId && (
        <div className="flex justify-center pt-4">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <QRCodeSVG 
              value={getConnectionUrl()}
              size={200}
              level="H"
              className="mx-auto"
            />
            <p className="text-sm text-gray-500 mt-4 text-center">
              Scan with another device to connect
            </p>
          </div>
        </div>
      )}
    </div>
  );
}