import { Check, Loader2 } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

export default function ConnectionStatus({ isConnected, isConnecting }: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center gap-2 text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600">
        <Check className="w-4 h-4" />
        <span>Connected! Ready to share.</span>
      </div>
    );
  }

  return null;
}