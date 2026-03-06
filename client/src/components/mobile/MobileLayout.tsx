import { Link, useLocation } from "wouter";
import { Home, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClub } from "@/contexts/club-context";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, href: "/m" },
  { id: "notifications", label: "Alerts", icon: Bell, href: "/m/notifications" },
  { id: "profile", label: "You", icon: User, href: "/m/profile" },
];

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const { selectedClub: club } = useClub();

  const clubColors = club?.colors as { primary?: string } | null | undefined;
  const primaryColor = clubColors?.primary ?? "#16a34a";

  const getActiveId = () => {
    if (location === "/m" || location === "/m/") return "home";
    if (location.startsWith("/m/team")) return "home";
    if (location.startsWith("/m/match")) return "home";
    if (location.startsWith("/m/notifications")) return "notifications";
    if (location.startsWith("/m/profile")) return "profile";
    return "home";
  };

  const activeId = getActiveId();

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-md mx-auto relative overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-4">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <Link key={item.id} href={item.href}>
                <div className="flex flex-col items-center gap-0.5 min-w-[60px] cursor-pointer">
                  <div className="relative flex items-center justify-center h-6 w-6">
                    {isActive && (
                      <span
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                    )}
                    <Icon
                      className={cn("h-5 w-5", !isActive && "text-gray-400")}
                      style={isActive ? { color: primaryColor } : undefined}
                    />
                  </div>
                  <span
                    className={cn("text-[10px] font-medium", !isActive && "text-gray-400")}
                    style={isActive ? { color: primaryColor } : undefined}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
