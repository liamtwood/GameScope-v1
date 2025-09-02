import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvailableSeasons, getCurrentSeason, getEffectiveSeasonStartMonth } from "@/utils/seasonUtils";
import { Team, Club, Competition } from "@shared/schema";
import { Calendar } from "lucide-react";

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
    <div className={`flex items-center gap-2 ${className}`}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedSeason} onValueChange={onSeasonChange}>
        <SelectTrigger className="w-[140px]" data-testid="select-season">
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