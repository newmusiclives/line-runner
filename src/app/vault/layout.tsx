import UpgradeGate from "@/components/UpgradeGate";

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="vault">{children}</UpgradeGate>;
}
