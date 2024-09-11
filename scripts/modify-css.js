/* eslint-disable no-console */
/* eslint-disable no-undef */
import { promises as fs } from 'fs';
import { resolve } from 'path';

const applyCustomStyles = async (cssFilePath) => {
  try {
    // Step 1: Read the CSS file
    let css = await fs.readFile(cssFilePath, 'utf8');

    // Define the changes you want to apply to the CSS
    const changes = {
      '.mapboxgl-popup-content': {
        'padding': '0px'
      },
      '.mapboxgl-ctrl-attrib': {
        'background-color': 'transparent'
      },
      '.mapboxgl-ctrl-attrib-inner': {
        'width': '50px',
        'height': '30px',
        'margin': '0',
        'padding': '0',
        'background-color': 'transparent',
        'display': 'block',
        'transform': 'scale(.52)',
        'right': '6.8px',
        'top': '1px',
        'background-image': "url('https://docs.barikoi.com/img/barikoi-logo-black.svg')"
      },
      '.mapboxgl-ctrl-attrib.mapboxgl-compact': {
        'display': 'none'
      }
    };

    // Function to add missing semicolons if needed
    const addMissingSemicolons = (propertiesBlock) => {
      return propertiesBlock
        .split(';') // Split each property based on semicolons
        .map((property) => property.trim()) // Trim leading/trailing space
        .filter(Boolean) // Remove empty properties
        .map((property) => 
          // Add semicolon if missing at the end of the property
          (property.endsWith('}') || property.endsWith(';') ? property : `${property};`))
        .join(' '); // Join back the properties with a space
    };

     // Step 2: Iterate through each CSS selector and its properties to modify the file
    for (const selector in changes) {
      const properties = changes[selector];
      const propertyString = Object.entries(properties)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ');

      // Regular expression to match existing CSS rules for the selector
      const regex = new RegExp(`(${selector}\\s*{)([^}]*)}`, 'g');

      if (css.match(regex)) {
        // If the selector exists, update its properties
        css = css.replace(regex, (match, p1, p2) => {
          const existingProperties = p2.trim() ? `${p2.trim()} ` : '';
          // Fix missing semicolons in the existing properties
          const fixedProperties = addMissingSemicolons(existingProperties);
          // Return the updated CSS rule with both existing and new properties
          return `${p1}${fixedProperties}${propertyString}}`;
        });
      } else {
        // If the selector doesn't exist, add the new rule to the CSS file
        css += `${selector} { ${propertyString} }\n`;
      }
    }
    // Step 3: Write the modified CSS back to the file
    await fs.writeFile(cssFilePath, css, 'utf8');
  } catch (error) {
    console.error('Error applying custom styles:', error);
  }
};

const copyCssFile = async () => {
  // Source path: where the CSS file is located
  const srcPath = resolve('node_modules/mapbox-gl/dist/mapbox-gl.css');
  
  // Destination path: new directory and file name
  const destPath = resolve('dist/styles/react-bkoi-gl.css');

  try {
    // Create the directory if it doesn't exist
    await fs.mkdir(resolve('dist/styles'), { recursive: true });

    // Copy the file to the new location with a new name
    await fs.copyFile(srcPath, destPath);
    console.log('CSS file copied successfully to:', destPath);

    // Apply custom styles after copying
    await applyCustomStyles(destPath);
  } catch (error) {
    console.error('Error copying CSS file:', error);
  }
};

// Run the function to copy the file
copyCssFile();
