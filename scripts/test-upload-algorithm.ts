import fs from "fs";
import path from "path";

// Test what happens to the background removal logic
console.log("Testing frame upload image processing...");
const imgPath = path.resolve("d:/lensly-main/public/oakley-meta-hstn.jpg");
if (fs.existsSync(imgPath)) {
  console.log("Oakley image exists, size:", fs.statSync(imgPath).size, "bytes");
} else {
  console.log("Oakley image not found!");
}
