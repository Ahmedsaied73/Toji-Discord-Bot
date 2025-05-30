const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Fix: Use the correct Supabase URL format (https://[project-ref].supabase.co)
const supabaseUrl = 'https://efiqlemztynxjrzhxbcy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaXFsZW16dHlueGpyemh4YmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0ODQ0NDEsImV4cCI6MjA2NDA2MDQ0MX0.f13WmWK61-QHoyR4m7Xyj2QYLIIqIX9ugCVbs6wiFFQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFacts(options = {}) {
  // Default options
  const defaultOptions = {
    forceUpload: false,       // Skip duplicate check if true
    filePath: 'characterContext.txt',
    batchSize: 10,           // Number of items to upload in parallel
    delayBetweenBatches: 500 // Milliseconds to wait between batches
  };
  
  // Merge provided options with defaults
  const config = { ...defaultOptions, ...options };
  try {
    // Resolve the file path
    const filePath = path.resolve(config.filePath);
    console.log(`Reading file from: ${filePath}`);
    
    // Read file with proper encoding
    const data = fs.readFileSync(filePath, 'utf8');
    
    // Improved parsing to handle paragraphs better with multiple possible separators
    // First try to split by double newlines, then by sections starting with headers
    let paragraphs = [];
    
    // Method 1: Split by double newlines
    const byDoubleNewline = data.split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p !== '');
      
    // Method 2: Split by headers (lines starting with #)
    const sections = [];
    const headerRegex = /^#[^\n]*$/m;
    let matches = [...data.matchAll(new RegExp(headerRegex, 'gm'))];
    
    if (matches.length > 0) {
      // If we found headers, split by them
      matches.forEach((match, index) => {
        const startPos = match.index;
        const endPos = index < matches.length - 1 ? matches[index + 1].index : data.length;
        sections.push(data.substring(startPos, endPos).trim());
      });
    }
    
    // Combine both methods and remove duplicates
     // Use a more robust deduplication approach
     const uniqueParagraphs = new Map();
     
     // Add paragraphs from both methods to the map using a normalized key
     [...byDoubleNewline, ...sections].forEach(p => {
       const normalized = p.trim().replace(/\s+/g, ' ').toLowerCase();
       if (normalized && normalized.length > 10) { // Only consider non-empty, substantial paragraphs
         uniqueParagraphs.set(normalized, p.trim());
       }
     });
     
     paragraphs = Array.from(uniqueParagraphs.values());
      
    // If we still don't have multiple paragraphs, try splitting by single newlines
    // but only if the lines are reasonably long (to avoid splitting sentences)
    if (paragraphs.length <= 1) {
      paragraphs = data.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 50) // Only consider substantial lines as paragraphs
        .filter(line => !line.startsWith('#')); // Skip headers
    }
    
    console.log(`Found ${paragraphs.length} paragraphs to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const paragraph of paragraphs) {
       // Skip empty paragraphs and headers (lines starting with #)
       if (!paragraph || paragraph.startsWith('#')) continue;
       
       // Truncate very long paragraphs if needed (Supabase might have limits)
       const factText = paragraph.length > 5000 ? paragraph.substring(0, 5000) + '...' : paragraph;
       
       // Check if this fact already exists in the database (unless force upload is enabled)
        if (!config.forceUpload) {
          const exists = await checkIfFactExists(factText);
          if (exists) {
            console.log(`Skipping duplicate: ${factText.substring(0, 30)}...`);
            continue;
          }
        }
       
       const { data, error } = await supabase
         .from('character_facts')
         .insert([{ fact_text: factText }]);

      if (error) {
        console.error('Failed to insert:', error.message);
        console.error('Paragraph:', factText.substring(0, 50) + '...');
        errorCount++;
      } else {
        console.log(`Inserted paragraph: ${factText.substring(0, 30)}...`);
        successCount++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nUpload complete: ${successCount} paragraphs inserted, ${errorCount} errors`);
  } catch (err) {
    console.error('Error reading or processing file:', err.message);
  }
}

// Function to check if a fact already exists in the database
async function checkIfFactExists(factText) {
  try {
    // Create a substring for matching (first 100 chars should be unique enough)
    const searchText = factText.substring(0, 100);
    
    const { data, error } = await supabase
      .from('character_facts')
      .select('fact_text')
      .like('fact_text', `%${searchText}%`)
      .limit(1);
      
    if (error) {
      console.error('Error checking for existing fact:', error.message);
      return false; // Assume it doesn't exist if there's an error
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error('Error in checkIfFactExists:', err.message);
    return false;
  }
}

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  forceUpload: args.includes('--force'),
  filePath: args.find(arg => arg.startsWith('--file='))?.split('=')[1] || 'characterContext.txt'
};

// Execute the function with options and handle any unhandled promise rejections
console.log('Starting upload with options:', options);
uploadFacts(options)
  .then(() => console.log('Process completed'))
  .catch(err => console.error('Unhandled error:', err));
