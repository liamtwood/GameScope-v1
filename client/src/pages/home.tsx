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

      {/* Gradient Background Container */}
      <div className="mt-12 flex justify-center">
        <Card className="w-full max-w-4xl overflow-hidden">
          <CardContent 
            className="p-8 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${(currentClub?.colors as any)?.primary || '#dc2626'} 0%, ${(currentClub?.colors as any)?.secondary || '#b91c1c'} 100%)`
            }}
          >
            {/* Lightning/Streak Texture Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0.03) 32%, transparent 32%),
                  linear-gradient(135deg, transparent 60%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.04) 62%, transparent 62%),
                  linear-gradient(45deg, transparent 80%, rgba(255,255,255,0.02) 80%, rgba(255,255,255,0.02) 85%, transparent 85%),
                  linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.03) 43%, transparent 43%),
                  linear-gradient(60deg, transparent 70%, rgba(255,255,255,0.02) 70%, rgba(255,255,255,0.02) 73%, transparent 73%)
                `,
                backgroundSize: '120px 120px, 80px 80px, 160px 160px, 100px 100px, 140px 140px'
              }}
            />
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">GameScope Dashboard</h3>
                <p className="text-white/90 max-w-md">
                  Manage your team with comprehensive tools for fixtures, squad management, statistics tracking, and performance analysis.
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Team Management</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">Statistics</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">Performance</span>
                </div>
              </div>
              {currentClub?.logoPath && (
                <div className="flex-shrink-0 ml-8">
                  <img 
                    src={currentClub.logoPath}
                    alt={`${currentClub.name} Logo`}
                    className="h-24 w-24 object-contain opacity-80"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}