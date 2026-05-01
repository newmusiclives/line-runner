import UpgradeGate from "@/components/UpgradeGate";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="studio_dashboard">{children}</UpgradeGate>;
}
