import UpgradeGate from "@/components/UpgradeGate";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="masterclass">{children}</UpgradeGate>;
}
