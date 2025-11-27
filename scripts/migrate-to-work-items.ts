import { db } from '../server/db';
import { workItems, workItemLinks, devopsChangeLog } from '../shared/schema';
import { testCases as hardcodedTestCases } from '../client/src/lib/requirements-registry';
import { randomUUID } from 'crypto';

async function migrateToWorkItems() {
  console.log('Starting migration to work_items table...');

  // 1. Migrate existing changelog entries
  const changelogEntries = await db.select().from(devopsChangeLog);
  console.log(`Found ${changelogEntries.length} changelog entries to migrate`);

  for (const entry of changelogEntries) {
    // Map changelog type to work item type
    let workItemType = entry.type;
    if (workItemType === 'added' || workItemType === 'removed' || workItemType === 'changed' || workItemType === 'fixed') {
      workItemType = 'enhancement'; // Convert changelog types to enhancement
    }

    // Map status
    let status = entry.status || 'open';
    if (status === 'resolved') status = 'resolved';
    if (status === 'closed') status = 'closed';

    await db.insert(workItems).values({
      id: entry.id,
      type: workItemType,
      title: entry.description.substring(0, 100), // First 100 chars as title
      description: entry.description,
      status: status,
      priority: entry.priority || undefined,
      area: entry.area.toLowerCase().replace(/\s+/g, '_'),
      date: entry.date,
      createdAt: entry.createdAt || new Date(),
      updatedAt: entry.updatedAt || new Date(),
    }).onConflictDoNothing();

    console.log(`  Migrated: ${entry.id}`);
  }

  // 2. Migrate test cases from hardcoded data
  console.log(`\nMigrating ${hardcodedTestCases.length} test cases...`);

  for (const tc of hardcodedTestCases) {
    // Map test case status
    let status = tc.status;
    
    await db.insert(workItems).values({
      id: tc.id,
      type: 'test_case',
      title: tc.title,
      description: tc.objective,
      status: status,
      area: tc.component?.toLowerCase().replace(/\s+/g, '_') || 'general',
      steps: tc.steps,
      expectedResult: tc.expectedResult,
      actualResult: tc.actualResult,
      tester: tc.tester,
      date: tc.date,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    console.log(`  Migrated test case: ${tc.id}`);

    // Create link to associated bug if exists
    if (tc.associatedBug) {
      const linkId = `LINK-${randomUUID().substring(0, 8)}`;
      await db.insert(workItemLinks).values({
        id: linkId,
        sourceId: tc.id,
        targetId: tc.associatedBug,
        linkType: 'traces_to',
        createdAt: new Date(),
      }).onConflictDoNothing();

      console.log(`    Created link: ${tc.id} -> ${tc.associatedBug}`);
    }
  }

  console.log('\nMigration complete!');
  
  // Show summary
  const items = await db.select().from(workItems);
  const links = await db.select().from(workItemLinks);
  console.log(`\nSummary:`);
  console.log(`  Work Items: ${items.length}`);
  console.log(`  Work Item Links: ${links.length}`);
  
  // Count by type
  const byType: Record<string, number> = {};
  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
  }
  console.log(`  By type:`, byType);
}

migrateToWorkItems()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
