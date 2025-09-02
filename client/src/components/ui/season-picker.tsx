import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableSeasons, getCurrentSeason, getEffectiveSeasonStartMonth } from "@/utils/seasonUtils";
import { Team, Club, Competition } from "@shared/schema";

interface SeasonPickerProps {
  team?: Team;
  club?: Club;
  competition?: Competition;
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
  className?: string;
}

export function SeasonPicker({
  team,
  club,
  competition,
  selectedSeason,
  onSeasonChange,
  className = "",
}: SeasonPickerProps) {
  const seasonStartMonth = getEffectiveSeasonStartMonth(team, club, competition);
  const availableSeasons = getAvailableSeasons(seasonStartMonth);
  const currentSeason = getCurrentSeason(seasonStartMonth);
  
  return (
    <div className={className}>
      <Select value={selectedSeason} onValueChange={onSeasonChange}>
        <SelectTrigger className="w-full" data-testid="select-season">
          <SelectValue placeholder="Select season" />
        </SelectTrigger>
        <SelectContent>
          {availableSeasons.map((season) => (
            <SelectItem key={season} value={season}>
              {season}
              {season === currentSeason && (
                <span className="ml-2 text-xs text-muted-foreground">(current)</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}