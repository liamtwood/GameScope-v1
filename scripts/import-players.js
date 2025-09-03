import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the Excel file
const filePath = path.join(__dirname, '../attached_assets/teamlist_1756916792801.xlsx');
const workbook = XLSX.readFile(filePath);

// Get the first worksheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Excel data:');
console.log(JSON.stringify(data, null, 2));