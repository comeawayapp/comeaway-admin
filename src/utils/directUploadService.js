// Direct upload service for DigitalOcean Spaces using AWS S3 SDK
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

class DirectUploadService {
  constructor() {
    this.bucket = import.meta.env.VITE_DO_SPACES_BUCKET;
    this.endpoint = import.meta.env.VITE_DO_SPACES_ENDPOINT;
    this.region = import.meta.env.VITE_DO_SPACES_REGION;
    this.accessKey = import.meta.env.VITE_DO_SPACES_KEY;
    this.secretKey = import.meta.env.VITE_DO_SPACES_SECRET;

    if (
      !this.bucket ||
      !this.endpoint ||
      !this.region ||
      !this.accessKey ||
      !this.secretKey
    ) {
      console.warn(
        "DigitalOcean Spaces configuration incomplete. Some environment variables are missing."
      );
    }

    // Initialize S3 client for DigitalOcean Spaces
    this.s3Client = new S3Client({
      endpoint: `https://${this.endpoint}`,
      region: this.region,
      credentials: {
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey,
      },
      forcePathStyle: false, // Use virtual-hosted style for DigitalOcean Spaces
    });
  }

  /**
   * Get environment-based path prefix
   */
  getEnvironmentPath() {
    const isProduction = import.meta.env.NODE_ENV;
    return isProduction == "production" ? "prod" : "dev";
  }

  /**
   * Generate unique object key for file with environment-based path
   */
  generateObjectKey(file, prefix = "") {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = file.name.replace(`.${fileExtension}`, "");
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_");

    const environmentPath = this.getEnvironmentPath();
    return `${environmentPath}/${prefix}${timestamp}_${randomString}_${sanitizedFileName}.${fileExtension}`;
  }

  /**
   * Upload file directly to DigitalOcean Spaces using AWS SDK
   */
  async uploadFileWithProgress(
    file,
    objectKey,
    contentType = null,
    onProgress = null
  ) {
    if (!contentType) {
      contentType = file.type || "application/octet-stream";
    }

    try {
      // console.log("Uploading file directly to DigitalOcean Spaces:", {
      //   objectKey,
      //   fileSize: file.size,
      //   contentType,
      //   bucket: this.bucket,
      //   endpoint: this.endpoint,
      // });

      // Convert File to Uint8Array for AWS SDK
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create upload command with proper ACL and headers
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: uint8Array,
        ContentType: contentType,
        ACL: "public-read",
        CacheControl: "public, max-age=31536000",
        Metadata: {
          "original-filename": file.name,
          "upload-timestamp": new Date().toISOString(),
          "file-size": file.size.toString(),
        },
      });

      // Calculate estimated upload time based on file size
      const calculateUploadTime = (fileSize) => {
        // Estimate upload speed based on file size (slower for larger files)
        let estimatedSpeed; // bytes per second

        if (fileSize < 1024 * 1024) {
          // < 1MB
          estimatedSpeed = 100000; // 200KB/s
        } else if (fileSize < 10 * 1024 * 1024) {
          // < 10MB
          estimatedSpeed = 200000; // 400KB/s
        } else if (fileSize < 50 * 1024 * 1024) {
          // < 50MB
          estimatedSpeed = 400000; // 800KB/s
        } else {
          // >= 50MB
          estimatedSpeed = 800000; // 1.5MB/s
        }

        return (fileSize / estimatedSpeed) * 1000; // minimum 3 seconds
      };

      const estimatedUploadTime = calculateUploadTime(file.size);
      const startTime = Date.now();

      const progressInterval = onProgress
        ? setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progressValue = Math.min(
              95,
              (elapsed / estimatedUploadTime) * 100
            );
            const loaded = Math.floor((file.size * progressValue) / 100);
            onProgress(loaded, file.size, Math.round(progressValue));
          }, 100)
        : null;

      // Execute upload using AWS SDK
      // console.log("Sending upload command...");
      const result = await this.s3Client.send(uploadCommand);

      // Clear progress interval and complete
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Complete progress
      if (onProgress) {
        onProgress(file.size, file.size, 100);
      }
      // console.log("Upload result:", result);

      // Return the public URL
      const fileUrl = `https://${this.bucket}.${this.endpoint}/${objectKey}`;

      // console.log("File uploaded successfully to DigitalOcean Spaces:", {
      //   objectKey,
      //   fileSize: file.size,
      //   fileUrl,
      //   etag: result.ETag,
      // });

      // Test if file is accessible
      setTimeout(async () => {
        try {
          const testResponse = await fetch(fileUrl);
          // console.log("File accessibility test:", {
          //   status: testResponse.status,
          //   accessible: testResponse.ok,
          // });
        } catch (error) {
          console.error("File accessibility test failed:", error);
        }
      }, 2000);

      return fileUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Get file URL from object key
   */
  getFileUrl(objectKey) {
    if (!this.bucket || !this.endpoint) {
      throw new Error("DigitalOcean Spaces configuration incomplete");
    }
    return `https://${this.bucket}.${this.endpoint}/${objectKey}`;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured() {
    return !!(
      this.bucket &&
      this.endpoint &&
      this.region &&
      this.accessKey &&
      this.secretKey
    );
  }
}

export default new DirectUploadService();
