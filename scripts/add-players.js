import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the Excel file
const filePath = path.join(__dirname, '../attached_assets/teamlist_1756916792801.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Team ID from the database
const teamId = '20f6518e-6b00-4700-8f56-7229363b4be7';

// Position mapping from abbreviations to full names
const positionMap = {
  'GK': 'Goalkeeper',
  'DEF': 'Defender', 
  'MID': 'Midfielder',
  'FWD': 'Forward'
};

// Add each player to the database
for (const player of data) {
  const playerData = {
    teamId: teamId,
    firstName: player['First Name'],
    lastName: player['Last Name'],
    position: positionMap[player.Position] || player.Position,
    jerseyNumber: player.Number,
    gender: player.Gender,
    status: 'Fit',
    keyPlayer: false,
    accountStatus: 'Active'
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerData),
    });
    
    if (response.ok) {
      console.log(`✓ Added ${player['First Name']} ${player['Last Name']} (#${player.Number})`);
    } else {
      console.error(`✗ Failed to add ${player['First Name']} ${player['Last Name']}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`✗ Error adding ${player['First Name']} ${player['Last Name']}:`, error.message);
  }
}

console.log('\n✅ Finished adding players!');