import { formatNumber } from "@/lib/utils";

interface TopSignaturesProps {
  topSignatures: { signature: string; sid: number; count: number }[];
}

export default function TopSignatures({ topSignatures }: TopSignaturesProps) {
  if (!topSignatures || topSignatures.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-5">
        <h2 className="text-sm font-semibold text-zinc-100 mb-4">
          Top Signatures
        </h2>
        <p className="text-sm text-zinc-500">No signature data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...topSignatures.map((s) => s.count));

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-5">
      <h2 className="text-sm font-semibold text-zinc-100 mb-4">
        Top Signatures
      </h2>
      <div className="space-y-3">
        {topSignatures.map((sig) => {
          const widthPercent = maxCount > 0 ? (sig.count / maxCount) * 100 : 0;
          return (
            <div key={sig.sid}>
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs text-zinc-300 truncate max-w-[70%]"
                  title={sig.signature}
                >
                  {sig.signature}
                </span>
                <span className="text-xs font-mono text-zinc-400 ml-2 shrink-0">
                  {formatNumber(sig.count)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-700/50 overflow-hidden">
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
