import UpgradeGate from "@/components/UpgradeGate";

export default function VoToolsLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="audio_quality">{children}</UpgradeGate>;
}
