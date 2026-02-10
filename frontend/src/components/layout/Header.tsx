import LiveIndicator from "@/components/shared/LiveIndicator";
import type { WsStatus } from "@/hooks/useWebSocket";
import ThemeSelector from "@/components/layout/ThemeSelector";

interface HeaderProps {
  title: string;
  wsStatus: WsStatus;
}

export default function Header({ title, wsStatus }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-app surface-1 backdrop-blur-sm px-6 py-4">
      <h1 className="text-lg font-semibold text-strong">{title}</h1>
      <div className="flex items-center gap-4">
        <LiveIndicator status={wsStatus} />
        <ThemeSelector />
      </div>
    </header>
  );
}
