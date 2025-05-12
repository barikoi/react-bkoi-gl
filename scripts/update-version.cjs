const fs = require('fs');
const path = require('path');

// Get package.json path
const packageJsonPath = path.join(__dirname, '../package.json');

// Import package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Current Time
const now = new Date();

// Read Markdown File
try {
  const data = fs.readFileSync('CHANGELOG.md', 'utf8');

  // Find Matched Line With `#`
  const regexHash = /^#.*/gm;
  const matchedHash = data.match(regexHash)?.[1];

  // Find Matched Data Inside `[]`
  const regexBrackets = /\[(.*?)\]/g; // NOSONAR
  const matchedBrackets = matchedHash.match(regexBrackets);
  
  // Current Version
  const version = matchedBrackets[0].slice(1, -1);

  // Deploy Time
  const formattedDate = `${ now.getDate() }-${ (now.getMonth() + 1).toString().padStart(2, '0') }-${ now.getFullYear() } ${ now.getHours() % 12 || 12 }:${ String(now.getMinutes()).padStart(2, '0') }:${ String(now.getSeconds()).padStart(2, '0') } ${ now.getHours() >= 12 ? 'PM' : 'AM' }`;

  // Update package.json With New Version And UpdatedAt Time
  const updatedPackageJson = { ...packageJson, version, updatedAt: formattedDate };

  // Write Updated package.json Back To File
  fs.writeFileSync('./package.json', JSON.stringify(updatedPackageJson, null, 2));
} catch (err) {
  console.error(err);
}