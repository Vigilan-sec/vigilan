import { formatNumber } from "@/lib/utils";

interface TopSignaturesProps {
  topSignatures: { signature: string; sid: number; count: number }[];
}

export default function TopSignatures({ topSignatures }: TopSignaturesProps) {
  if (!topSignatures || topSignatures.length === 0) {
    return (
      <div className="rounded-lg border border-app surface-2 p-5">
        <h2 className="text-sm font-semibold text-strong mb-4">
          Top Signatures
        </h2>
        <p className="text-sm text-subtle">No signature data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...topSignatures.map((s) => s.count));

  return (
    <div className="rounded-lg border border-app surface-2 p-5">
      <h2 className="text-sm font-semibold text-strong mb-4">
        Top Signatures
      </h2>
      <div className="space-y-3">
        {topSignatures.map((sig) => {
          const widthPercent = maxCount > 0 ? (sig.count / maxCount) * 100 : 0;
          return (
            <div key={sig.sid}>
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs text-muted truncate max-w-[70%]"
                  title={sig.signature}
                >
                  {sig.signature}
                </span>
                <span className="text-xs font-mono text-subtle ml-2 shrink-0">
                  {formatNumber(sig.count)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500/80 to-orange-500/80 transition-all duration-500"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
