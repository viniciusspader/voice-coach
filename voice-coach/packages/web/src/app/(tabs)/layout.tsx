import { AuthGate } from "@/components/AuthGate";
import { TabBar } from "@/components/TabBar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex flex-col h-dvh bg-deep">
        <main className="flex-1 overflow-y-auto pb-20">{children}</main>
        <TabBar />
      </div>
    </AuthGate>
  );
}
