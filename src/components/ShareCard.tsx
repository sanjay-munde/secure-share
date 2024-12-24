import { useState } from "react";
import NeomorphicInput from "./NeomorphicInput";
import NeomorphicButton from "./NeomorphicButton";
import { QrCode, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function ShareCard() {
  const [text, setText] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="neo-card space-y-6">
      <h2 className="text-2xl font-semibold text-neo-text mb-6">
        Share Securely
      </h2>
      
      <div className="space-y-4">
        <NeomorphicInput
          placeholder="Enter text to share..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="flex gap-4">
          <NeomorphicButton
            onClick={() => setShowQR(!showQR)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            {showQR ? "Hide QR" : "Show QR"}
          </NeomorphicButton>
          
          <NeomorphicButton
            onClick={handleCopy}
            className="flex items-center gap-2"
            disabled={!text}
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </NeomorphicButton>
        </div>
      </div>

      {showQR && text && (
        <div className="flex justify-center pt-4">
          <div className="neo-card bg-white p-4">
            <QRCodeSVG value={text} size={200} level="H" />
          </div>
        </div>
      )}
    </div>
  );
}