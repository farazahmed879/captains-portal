export type WidgetKey = 'players' | 'tournaments' | 'teams' | 'sponsors';

export interface WidgetSelections {
  playerId: string;
  tournamentId: string;
  teamId: string;
  sponsorId: string;
}

export type AutosaveStatus = 'idle' | 'saving' | 'saved';

export const WIDGET_STORAGE_KEY = 'captains_portal_dashboard_widgets';
export const WIDGET_SELECTIONS_KEY = 'captains_portal_dashboard_selections';

