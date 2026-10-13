import { v2 as cloudinary } from "cloudinary";

// Configure with server-side env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  console.log("Testing real upload to Cloudinary...");
  console.log("Cloud Name set:", Boolean(process.env.CLOUDINARY_CLOUD_NAME));
  console.log("API Key set:", Boolean(process.env.CLOUDINARY_API_KEY));
  console.log("API Secret set:", Boolean(process.env.CLOUDINARY_API_SECRET));

  // 1x1 transparent PNG data URI
  const sampleDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const result = await cloudinary.uploader.upload(sampleDataUri, {
    folder: "creator-os/test",
    resource_type: "image",
  });

  console.log("Upload Success!");
  console.log("Public ID:", result.public_id);
  console.log("Secure URL:", result.secure_url);
  console.log("Format:", result.format);
  console.log("Bytes:", result.bytes);
  console.log("CLOUDINARY_UPLOAD_VERIFIED");
}

main().catch((err) => {
  console.error("Cloudinary upload failed:", err.message || err);
  process.exit(1);
});
