import UpgradeGate from "@/components/UpgradeGate";

export default function PassLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="pass_memberships">{children}</UpgradeGate>;
}
