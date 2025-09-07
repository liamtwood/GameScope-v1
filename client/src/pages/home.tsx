import { MainLayout } from "@/components/layout/main-layout";
import { useClub } from "@/contexts/club-context";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { selectedClub: currentClub } = useClub();

  return (
    <MainLayout 
      title="Home"
      subtitle="Welcome to your team management dashboard"
    >
      {/* Welcome Section */}
      <div className="flex flex-col items-center mb-8 py-6">
        <div className="mb-6">
          {currentClub?.logoPath ? (
            <img 
              src={currentClub.logoPath}
              alt={`${currentClub.name} Logo`} 
              className="h-32 w-32 object-contain rounded-lg"
              data-testid="img-club-logo"
            />
          ) : (
            <div className="h-32 w-32 flex items-center justify-center bg-muted rounded-lg">
              <span className="text-muted-foreground font-bold text-lg">
                {currentClub?.shortName || 'CLUB'}
              </span>
            </div>
          )}
        </div>
        <h2 className="text-3xl font-bold text-foreground" data-testid="text-welcome-message">
          Welcome to GameScope
        </h2>
      </div>

      {/* Quick Actions or Overview Content */}
      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Your sports team management platform for tracking performance and organizing your team
        </p>
        <p className="text-sm text-muted-foreground">
          Select a team from the sidebar to get started with managing fixtures, squad, and statistics
        </p>
      </div>

      {/* Simple Test Container */}
      <div className="mt-12 flex justify-center">
        <div 
          className="w-64 h-32 border-2 border-gray-400"
          style={{
            borderColor: (currentClub?.colors as any)?.primary || '#dc2626'
          }}
        >
        </div>
      </div>
    </MainLayout>
  );
}