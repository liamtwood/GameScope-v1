import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Bell } from "lucide-react";

export default function MobileNotifications() {
  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-6">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">No Notifications</h2>
        <p className="text-sm text-gray-500">You're all caught up. Check back later for updates.</p>
      </div>
    </MobileLayout>
  );
}
