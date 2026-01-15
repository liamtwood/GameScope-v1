import { db } from "../server/db";
import { pageRequirements } from "../shared/schema";
import { requirementsRegistry } from "../client/src/lib/requirements-registry";
import { eq } from "drizzle-orm";

async function updateParentFrIds() {
  console.log("Updating database with parentFrId mappings...");
  
  for (const page of requirementsRegistry) {
    try {
      await db.update(pageRequirements)
        .set({ 
          acceptanceCriteria: page.acceptanceCriteria,
          functionalRequirements: page.functionalRequirements 
        })
        .where(eq(pageRequirements.id, page.id));
      console.log(`Updated page: ${page.id}`);
    } catch (error) {
      console.error(`Failed to update page ${page.id}:`, error);
    }
  }
  
  console.log("Done!");
  process.exit(0);
}

updateParentFrIds();
