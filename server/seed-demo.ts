import { db } from './db';
import { fixtures, oppositionTeams, competitions, matchEvents } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENGLAND_FOOTBALL_CLUB_ID = '6bbadb87-022c-440c-a2ae-efd58907359c';
const ENGLAND_WOMENS_TEAM_ID    = '7b686798-9906-4ec3-9d78-2b6ad7ce6b80';
const FIXTURE_ID                = 'c6a7fa2f-d625-4422-9bb6-090cf44410dc';

export async function seedWWCDemoFixture() {
  try {
    const existing = await db
      .select({ id: fixtures.id })
      .from(fixtures)
      .where(eq(fixtures.id, FIXTURE_ID))
      .limit(1);

    if (existing.length > 0) {
      console.log('[seed] WWC demo fixture already present — skipping');
      return;
    }

    console.log('[seed] Creating WWC 2023 Spain vs England demo fixture…');

    const [opp] = await db
      .insert(oppositionTeams)
      .values({
        id: crypto.randomUUID(),
        name: 'Spain',
        clubId: ENGLAND_FOOTBALL_CLUB_ID,
        isVisible: true,
      })
      .returning();

    const [comp] = await db
      .insert(competitions)
      .values({
        id: crypto.randomUUID(),
        name: 'World Cup 2023',
        clubId: ENGLAND_FOOTBALL_CLUB_ID,
      })
      .returning();

    await db.insert(fixtures).values({
      id: FIXTURE_ID,
      teamId: ENGLAND_WOMENS_TEAM_ID,
      opponent: 'Spain',
      date: new Date('2023-08-20T20:00:00Z'),
      venue: 'Stadium Australia, Sydney',
      type: 'HOME',
      status: 'COMPLETED',
      homeScore: 0,
      awayScore: 1,
      hasVideo: true,
      videoLinks: [
        {
          id: '1777377795754-8cq0mqlie',
          url: 'https://www.youtube.com/watch?v=jD1GwCcJV-0',
          duration: '1st_half',
          location: 'halfway_line',
          uploadedAt: '2026-04-28T12:03:15.754Z',
          kickoffOffset: 81,
        },
      ],
      oppositionTeamId: opp.id,
      competitionId: comp.id,
    });

    const eventsFilePath = existsSync(join(process.cwd(), 'dist/public/data/match-events.json'))
      ? join(process.cwd(), 'dist/public/data/match-events.json')
      : join(process.cwd(), 'client/public/data/match-events.json');

    const events = JSON.parse(readFileSync(eventsFilePath, 'utf-8'));

    await db.insert(matchEvents).values({
      fixtureId: FIXTURE_ID,
      events,
      source: 'Spain vs England - 2023 WWC Final',
      highlightsTimestamps: {
        '00ba12fc-42f9-4d0f-bc91-062e63724f07': 126,
        '30728cd8-f0a6-4535-8f24-16a37a1d4f08': 82,
        '4d11233b-219f-4526-977f-2247792f6ff7': 223,
        '5b235a81-43c4-4edb-a948-579cff17bf3e': 169,
      },
    });

    console.log('[seed] WWC 2023 demo fixture seeded successfully ✓');
  } catch (err) {
    console.error('[seed] WWC demo seed failed:', err);
  }
}
