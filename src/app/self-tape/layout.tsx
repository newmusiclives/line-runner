import UpgradeGate from "@/components/UpgradeGate";

export default function SelfTapeLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="self_tape">{children}</UpgradeGate>;
}
