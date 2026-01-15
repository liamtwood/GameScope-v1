import { db } from "../server/db";
import { workItems, pageRequirements } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createEpicHierarchy() {
  console.log("Creating Epic → FR → AC hierarchy...\n");

  const pages = await db.select().from(pageRequirements);
  console.log(`Found ${pages.length} pages to create as Epics\n`);

  let epicsCreated = 0;
  let frsUpdated = 0;
  let acsUpdated = 0;

  for (const page of pages) {
    const epicId = `EPIC-${page.id.toUpperCase()}`;
    const epicTitle = page.title;
    
    const existingEpic = await db.select().from(workItems).where(eq(workItems.id, epicId));
    
    if (existingEpic.length === 0) {
      await db.insert(workItems).values({
        id: epicId,
        type: "epic",
        title: epicTitle,
        description: page.overview || `Epic for ${page.title}`,
        parentId: null,
        pageId: page.id,
        status: "defined",
        appId: page.appId || "gamescope",
      });
      console.log(`Created Epic: ${epicId} - ${epicTitle}`);
      epicsCreated++;
    } else {
      console.log(`Epic already exists: ${epicId}`);
    }

    const frs = page.functionalRequirements as Array<{ id: string; title: string; description: string }>;
    for (const fr of frs) {
      await db.update(workItems)
        .set({ parentId: epicId, pageId: page.id })
        .where(eq(workItems.id, fr.id));
      frsUpdated++;
    }

    const acs = page.acceptanceCriteria as Array<{ id: string; description: string; parentFrId?: string }>;
    for (const ac of acs) {
      if (ac.parentFrId) {
        await db.update(workItems)
          .set({ parentId: ac.parentFrId, pageId: page.id })
          .where(eq(workItems.id, ac.id));
        acsUpdated++;
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Epics created: ${epicsCreated}`);
  console.log(`- FRs updated with Epic parent: ${frsUpdated}`);
  console.log(`- ACs updated with FR parent: ${acsUpdated}`);

  const hierarchy = await db.select().from(workItems).where(eq(workItems.type, "epic"));
  console.log(`\nEpic count in work_items: ${hierarchy.length}`);

  process.exit(0);
}

createEpicHierarchy().catch(console.error);
