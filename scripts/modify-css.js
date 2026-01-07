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
      'a.maplibregl-ctrl-logo': {
        'display': 'block',
        'width': '88px',
        'height': '23px',
        'margin': '5px 0px',
        'overflow': 'hidden',
        'position': 'relative',
        'transform': 'scale(0.75)',
        'background-image': "url('data:image/png;base64,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')",
        'pointer-events': 'auto',
        'cursor': 'pointer',
        'z-index': '3',
      },
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
    console.log('Custom styles applied successfully to:', cssFilePath);
  } catch (error) {
    console.error('Error applying custom styles:', error);
  }
};

const createTypeDefinition = async () => {
  const typesContent = `declare module 'react-bkoi-gl/styles' {
  const styles: string;
  export default styles;
}`;

  try {
    await fs.writeFile(resolve('dist/styles/index.d.ts'), typesContent, 'utf8');
    console.log('Type definition file created successfully');
  } catch (error) {
    console.error('Error creating type definition file:', error);
  }
};

const copyCssFile = async () => {
  // Source path: where the CSS file is located
  const srcPath = resolve('node_modules/maplibre-gl/dist/maplibre-gl.css');

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
    
    // Create type definition file
    await createTypeDefinition();
  } catch (error) {
    console.error('Error copying CSS file:', error);
  }
};

// Run the function to copy the file
copyCssFile();
