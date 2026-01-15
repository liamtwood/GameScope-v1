import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const acToFrMapping: Record<string, string> = {
  "AC-001": "FR-001", "AC-002": "FR-001", "AC-003": "FR-001",
  "AC-004": "FR-002", "AC-005": "FR-002", "AC-006": "FR-002", "AC-007": "FR-002",
  "AC-008": "FR-003", "AC-009": "FR-003", "AC-010": "FR-003", "AC-011": "FR-003",
  "AC-012": "FR-004", "AC-013": "FR-004", "AC-014": "FR-004", "AC-015": "FR-004", "AC-016": "FR-004",
  "AC-017 (Epic)": "FR-003", "AC-018 (Epic)": "FR-003",
  "AC-019": "FR-005", "AC-020": "FR-005", "AC-021": "FR-005",
  "AC-022": "FR-006", "AC-023": "FR-006",
  "AC-024": "FR-007", "AC-025": "FR-007",
  "AC-026 (Epic)": "FR-005", "AC-027 (Epic)": "FR-005",
  "AC-028": "FR-008", "AC-029": "FR-008",
  "AC-030": "FR-009", "AC-031": "FR-009",
  "AC-032": "FR-010", "AC-033": "FR-010", "AC-034": "FR-010",
  "AC-035": "FR-011", "AC-036": "FR-011",
  "AC-037": "FR-012", "AC-038": "FR-012", "AC-039": "FR-012", "AC-040": "FR-012",
  "AC-041": "FR-013", "AC-042": "FR-013", "AC-043": "FR-013",
  "AC-044": "FR-014", "AC-045": "FR-014", "AC-046": "FR-014", "AC-047": "FR-014",
  "AC-048": "FR-015", "AC-049": "FR-015",
  "AC-050": "FR-016", "AC-051": "FR-016",
  "AC-052": "FR-017", "AC-053": "FR-017", "AC-054": "FR-017", "AC-055": "FR-017", "AC-056": "FR-017", "AC-057": "FR-017",
  "AC-058": "FR-019", "AC-059": "FR-019", "AC-060": "FR-019",
  "AC-061": "FR-020", "AC-062": "FR-020", "AC-063": "FR-020",
  "AC-064": "FR-021", "AC-065": "FR-021",
  "AC-066": "FR-022", "AC-067": "FR-022", "AC-068": "FR-022",
  "AC-069 (Epic)": "FR-008", "AC-070 (Epic)": "FR-008", "AC-071 (Epic)": "FR-008",
  "AC-072": "FR-023", "AC-073": "FR-023", "AC-074": "FR-023", "AC-075": "FR-023",
  "AC-076": "FR-024", "AC-077": "FR-024", "AC-078": "FR-024",
  "AC-079": "FR-025", "AC-080": "FR-025",
  "AC-081": "FR-026", "AC-082": "FR-026",
  "AC-083": "FR-027", "AC-084": "FR-027",
  "AC-085": "FR-028", "AC-086": "FR-028", "AC-087": "FR-028",
  "AC-088": "FR-029", "AC-089": "FR-029", "AC-090": "FR-029",
  "AC-091 (Epic)": "FR-023", "AC-092 (Epic)": "FR-023", "AC-093 (Epic)": "FR-023",
  "AC-094": "FR-030", "AC-095": "FR-030", "AC-096": "FR-030",
  "AC-097": "FR-031", "AC-098": "FR-031", "AC-099": "FR-031",
  "AC-100": "FR-032", "AC-101": "FR-032",
  "AC-102": "FR-033", "AC-103": "FR-033",
  "AC-104": "FR-034", "AC-105": "FR-034", "AC-106": "FR-034",
  "AC-107": "FR-035", "AC-108": "FR-035",
  "AC-109": "FR-036", "AC-110": "FR-036",
  "AC-111": "FR-037", "AC-112": "FR-037",
  "AC-113": "FR-038", "AC-114": "FR-038",
  "AC-115": "FR-039", "AC-116": "FR-039",
  "AC-117 (Epic)": "FR-030", "AC-118 (Epic)": "FR-030", "AC-119 (Epic)": "FR-030",
  "AC-120": "FR-040", "AC-121": "FR-040", "AC-122": "FR-040",
  "AC-123": "FR-041", "AC-124": "FR-041",
  "AC-125": "FR-042", "AC-126": "FR-042",
  "AC-127": "FR-043", "AC-128": "FR-043",
  "AC-129": "FR-044", "AC-130": "FR-044",
  "AC-131 (Epic)": "FR-040",
  "AC-132": "FR-045", "AC-133": "FR-045", "AC-134": "FR-045", "AC-135": "FR-045",
  "AC-136": "FR-046", "AC-137": "FR-046", "AC-138": "FR-046",
  "AC-139": "FR-047", "AC-140": "FR-047",
  "AC-141": "FR-048", "AC-142": "FR-048",
  "AC-143": "FR-049", "AC-144": "FR-049",
  "AC-145": "FR-050", "AC-146": "FR-050",
  "AC-147 (Epic)": "FR-045", "AC-148 (Epic)": "FR-045",
  "AC-149": "FR-051", "AC-150": "FR-051", "AC-151": "FR-051",
  "AC-152": "FR-052", "AC-153": "FR-052",
  "AC-154": "FR-053", "AC-155": "FR-053", "AC-156": "FR-053",
  "AC-157 (Epic)": "FR-051",
  "AC-158": "FR-054", "AC-159": "FR-054", "AC-160": "FR-054",
  "AC-161": "FR-055", "AC-162": "FR-055", "AC-163": "FR-055",
  "AC-164": "FR-056", "AC-165": "FR-056",
  "AC-166": "FR-057", "AC-167": "FR-057", "AC-168": "FR-057",
  "AC-169": "FR-058", "AC-170": "FR-058",
  "AC-171": "FR-059", "AC-172": "FR-059",
  "AC-173": "FR-060", "AC-174": "FR-060",
  "AC-175 (Epic)": "FR-054",
  "AC-176": "FR-061", "AC-177": "FR-061",
  "AC-178": "FR-062", "AC-179": "FR-062", "AC-180": "FR-062",
  "AC-181": "FR-063", "AC-182": "FR-063",
  "AC-091": "FR-029",
  "AC-092": "FR-029",
  "AC-094 (Epic)": "FR-023",
  "AC-095 (Epic)": "FR-023",
  "AC-110 (Epic)": "FR-027",
  "AC-117": "FR-040",
  "AC-118": "FR-040",
  "AC-119": "FR-040",
  "AC-131": "FR-044",
  "AC-147": "FR-050",
  "AC-149 (Epic)": "FR-045",
  "AC-157": "FR-053",
  "AC-175": "FR-054",
  "AC-179 (Epic)": "FR-054",
  "AC-180 (Epic)": "FR-054",
};

const filePath = path.join(__dirname, '../client/src/lib/requirements-registry.ts');
let content = fs.readFileSync(filePath, 'utf-8');

let updatedCount = 0;
for (const [acId, frId] of Object.entries(acToFrMapping)) {
  const escapedAcId = acId.replace(/[()]/g, '\\$&');
  const regex = new RegExp(`(\\{ id: "${escapedAcId}", description: "[^"]+")( \\})`, 'g');
  const replacement = `$1, parentFrId: "${frId}"$2`;
  const newContent = content.replace(regex, replacement);
  if (newContent !== content) {
    updatedCount++;
    content = newContent;
  }
}

fs.writeFileSync(filePath, content);
console.log(`Updated ${updatedCount} ACs with parentFrId mappings`);
