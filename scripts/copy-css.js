/* eslint-disable no-console */
/* eslint-disable no-undef */
import { promises as fs } from 'fs';
import { resolve } from 'path';

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
  } catch (error) {
    console.error('Error copying CSS file:', error);
  }
};

// Run the function to copy the file
copyCssFile();

