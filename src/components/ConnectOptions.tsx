import { useState } from "react";
import { QrCode, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ConnectOptionsProps {
  connectionId: string;
  deviceId: string;
  isConnecting: boolean;
  onInitConnection: () => void;
}

export default function ConnectOptions({ 
  connectionId, 
  deviceId, 
  isConnecting, 
  onInitConnection 
}: ConnectOptionsProps) {
  const [showQR, setShowQR] = useState(false);
  const [pinCode, setPinCode] = useState("");

  // Generate the connection URL that will be encoded in the QR code
  const getConnectionUrl = () => {
    // Get the current origin (base URL) of the application
    const baseUrl = window.location.origin;
    // Create a URL with connection parameters
    const connectionUrl = new URL(baseUrl);
    connectionUrl.searchParams.set("connectionId", connectionId);
    connectionUrl.searchParams.set("hostDeviceId", deviceId);
    connectionUrl.searchParams.set("action", "connect");
    return connectionUrl.toString();
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Connect Devices</h3>
        <p className="text-sm text-gray-500">
          Scan QR code or enter 4-digit code to connect devices
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => {
            onInitConnection();
            setShowQR(true);
          }}
          disabled={isConnecting}
          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
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

        <div className="flex-1">
          <input
            type="text"
            maxLength={4}
            placeholder="Enter 4-digit code"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
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