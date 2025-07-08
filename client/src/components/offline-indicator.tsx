
import { useCapacitor } from '@/hooks/use-capacitor';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const { isOnline, isNative } = useCapacitor();

  if (!isNative) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge
        variant={isOnline ? 'default' : 'destructive'}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>
    </div>
  );
}
