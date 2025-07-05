import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Dashboard />
      </div>
    </div>
  );
}
