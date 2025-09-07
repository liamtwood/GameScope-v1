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

      {/* Honeycomb Background Container */}
      <div className="mt-12 flex justify-center">
        <div 
          className="honeycomb-container relative overflow-hidden rounded-lg"
          style={{
            width: '600px',
            height: '400px',
            '--cell-size': '60px',
            '--columns': '12',
            '--gap': '2px',
            '--cell-height': 'calc(var(--cell-size) * 1.15)',
            '--row-height': 'calc(var(--cell-size) * 0.8666)',
            '--margin-offset': 'calc(var(--cell-size) / 2 + var(--gap) / 2)',
            backgroundColor: (currentClub?.colors as any)?.primary || '#dc2626'
          } as React.CSSProperties}
        >
          <div 
            className="honeycomb absolute inset-0"
            style={{
              display: 'grid',
              width: '100%',
              height: '100%',
              transform: 'translateX(calc(var(--margin-offset) / -2)) scale(1.2)',
              transformOrigin: 'center center',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gridAutoRows: 'var(--row-height)',
              gap: 'var(--gap)',
              paddingTop: '20px'
            }}
          >
            {/* Generate honeycomb cells */}
            {Array.from({ length: 84 }, (_, index) => (
              <div
                key={index}
                className="cell"
                style={{
                  width: 'var(--cell-size)',
                  height: 'var(--cell-height)',
                  margin: '0',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  textAlign: 'center',
                  marginLeft: (Math.floor(index / 12) % 2 === 1 && (index % 12) >= 0) ? 'var(--margin-offset)' : '0'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}