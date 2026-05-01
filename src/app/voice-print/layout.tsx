import UpgradeGate from "@/components/UpgradeGate";

export default function VoicePrintLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="voice_print">{children}</UpgradeGate>;
}
