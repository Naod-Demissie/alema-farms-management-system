"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { FileUploadData, ApiResponse } from "./types";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

// Upload file
export const uploadFile = async (data: FileUploadData): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    // Validate file
    if (!data.file) {
      return {
        success: false,
        message: "No file provided"
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (data.file.size > maxSize) {
      return {
        success: false,
        message: "File size exceeds 10MB limit"
      };
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(data.file.type)) {
      return {
        success: false,
        message: "File type not allowed"
      };
    }

    // Generate unique filename
    const fileExtension = data.file.name.split('.').pop();
    const uniqueName = `${randomBytes(16).toString('hex')}.${fileExtension}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', data.folder);
    const filePath = join(uploadDir, uniqueName);

    // Convert file to buffer
    const bytes = await data.file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Generate file URL
    const fileUrl = `/uploads/${data.folder}/${uniqueName}`;

    // In a real implementation, you would save file metadata to database
    const fileRecord = {
      id: randomBytes(16).toString('hex'),
      originalName: data.file.name,
      fileName: uniqueName,
      filePath,
      fileUrl,
      size: data.file.size,
      type: data.file.type,
      folder: data.folder,
      uploadedBy: currentUser.id,
      uploadedAt: new Date(),
      metadata: data.metadata || {}
    };

    return {
      success: true,
      data: fileRecord,
      message: "File uploaded successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to upload file"
    };
  }
};

// Delete file
export const deleteFile = async (fileUrl: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    // Extract file path from URL
    const filePath = join(process.cwd(), 'public', fileUrl);

    // Check if file exists and delete
    try {
      await unlink(filePath);
    } catch (error) {
      return {
        success: false,
        message: "File not found or already deleted"
      };
    }

    // In a real implementation, you would also remove the file record from database

    return {
      success: true,
      message: "File deleted successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to delete file"
    };
  }
};

// Get file URL
export const getFileUrl = async (fileId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    // In a real implementation, you would fetch file record from database
    // For now, we'll return a placeholder

    return {
      success: true,
      data: {
        fileId,
        url: `/uploads/files/${fileId}`,
        message: "File URL retrieved successfully"
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get file URL"
    };
  }
};

// Upload staff avatar
export const uploadStaffAvatar = async (staffId: string, file: File): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    // Check permissions
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: "Only image files are allowed for avatars"
      };
    }

    // Upload file
    const uploadResult = await uploadFile({
      file,
      folder: 'avatars',
      staffId,
      metadata: { type: 'avatar' }
    });

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Update staff record with new avatar URL
    // This would typically be done in the staff.ts file
    // For now, we'll just return the upload result

    return {
      success: true,
      data: {
        staffId,
        avatarUrl: uploadResult.data?.fileUrl,
        message: "Avatar uploaded successfully"
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to upload avatar"
    };
  }
};

// Get file metadata
export const getFileMetadata = async (fileId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    // In a real implementation, you would fetch file metadata from database
    // For now, we'll return a placeholder

    return {
      success: true,
      data: {
        fileId,
        name: "example-file.pdf",
        size: 1024,
        type: "application/pdf",
        uploadedAt: new Date(),
        uploadedBy: "user-id"
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get file metadata"
    };
  }
};
