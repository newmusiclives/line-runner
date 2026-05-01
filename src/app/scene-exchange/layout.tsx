import UpgradeGate from "@/components/UpgradeGate";

export default function SceneExchangeLayout({ children }: { children: React.ReactNode }) {
  return <UpgradeGate feature="scene_exchange">{children}</UpgradeGate>;
}
