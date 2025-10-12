"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

// Validation schemas
const VaccinationSchema = z.object({
  vaccineName: z.string().min(1, "Vaccine name is required"),
  flockId: z.string().min(1, "Flock ID is required"),
  administeredDate: z.string().min(1, "Administered date is required"),
  administeredBy: z.string().min(1, "Administered by is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  dosage: z.string().min(1, "Dosage is required"),
  notes: z.string().optional(),
  status: z.string().optional().default("completed"),
});

const TreatmentSchema = z.object({
  flockId: z.string().min(1, "Flock ID is required"),
  disease: z.enum(["respiratory", "digestive", "parasitic", "nutritional", "other"]),
  diseaseName: z.string().min(1, "Disease name is required"),
  medication: z.string().min(1, "Medication is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  treatedBy: z.string().min(1, "Treated by is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  symptoms: z.string().optional(),
});


const MortalitySchema = z.object({
  flockId: z.string().min(1, "Flock ID is required"),
  date: z.string().min(1, "Date is required"),
  count: z.number().min(1, "Count must be at least 1"),
  cause: z.enum(["disease", "injury", "environmental", "unknown"]),
  causeDescription: z.string().min(1, "Cause description is required"),
  recordedBy: z.string().min(1, "Recorded by is required"),
});

// Vaccination Management
export async function getVaccinations(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string
): Promise<ApiResponse<any>> {
  try {
    console.log("getVaccinations called with:", { page, limit, search, status });
    const authResult = await getAuthenticatedUser();
    console.log("Auth result:", authResult);
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { vaccineName: { contains: search, mode: "insensitive" } },
        { flockId: { contains: search, mode: "insensitive" } },
        { administeredBy: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    console.log("Querying vaccinations with where clause:", where);
    const [vaccinations, total] = await Promise.all([
      prisma.vaccinations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { administeredDate: "desc" },
        include: {
          flock: {
            select: {
              id: true,
              batchCode: true,
            }
          }
        }
      }),
      prisma.vaccinations.count({ where }),
    ]);

    console.log("Found vaccinations:", vaccinations.length, "Total:", total);

    return {
      success: true,
      data: {
        vaccinations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
    return {
      success: false,
      message: "Failed to fetch vaccinations",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createVaccination(data: any): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const validatedData = VaccinationSchema.parse(data);
    
    const vaccination = await prisma.vaccinations.create({
      data: {
        ...validatedData,
        administeredDate: new Date(validatedData.administeredDate),
      },
    });

    return {
      success: true,
      data: vaccination,
    };
  } catch (error) {
    console.error("Error creating vaccination:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: "Failed to create vaccination",
    };
  }
}

export async function updateVaccination(id: string, data: any): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const validatedData = VaccinationSchema.partial().parse(data);
    
    const vaccination = await prisma.vaccinations.update({
      where: { id },
      data: {
        ...validatedData,
        administeredDate: validatedData.administeredDate ? new Date(validatedData.administeredDate) : undefined,
      },
    });

    return {
      success: true,
      data: vaccination,
    };
  } catch (error) {
    console.error("Error updating vaccination:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: "Failed to update vaccination",
    };
  }
}

export async function deleteVaccination(id: string): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    // Check if vaccination exists first
    const existingVaccination = await prisma.vaccinations.findUnique({
      where: { id },
    });

    if (!existingVaccination) {
      return {
        success: false,
        message: "Vaccination record not found"
      };
    }

    await prisma.vaccinations.delete({
      where: { id },
    });

    return {
      success: true,
      data: { id },
      message: "Vaccination record deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting vaccination:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: `Failed to delete vaccination: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

// Treatment Management
export async function getTreatments(
  page: number = 1,
  limit: number = 10,
  search?: string,
  disease?: string,
  status?: string
): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { diseaseName: { contains: search, mode: "insensitive" } },
        { medication: { contains: search, mode: "insensitive" } },
        { flockId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (disease && disease !== "all") {
      where.disease = disease;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const [treatments, total] = await Promise.all([
      prisma.treatments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          treatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          flock: {
            select: {
              id: true,
              batchCode: true,
            },
          },
        },
      }),
      prisma.treatments.count({ where }),
    ]);

    return {
      success: true,
      data: {
        treatments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching treatments:", error);
    return {
      success: false,
      error: "Failed to fetch treatments",
    };
  }
}

export async function createTreatment(data: any): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const validatedData = TreatmentSchema.parse(data);
    
    const treatment = await prisma.treatments.create({
      data: {
        flockId: validatedData.flockId,
        disease: validatedData.disease,
        diseaseName: validatedData.diseaseName,
        medication: validatedData.medication,
        dosage: validatedData.dosage,
        frequency: validatedData.frequency,
        duration: validatedData.duration,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        notes: validatedData.notes,
        symptoms: validatedData.symptoms,
        treatedById: validatedData.treatedBy,
        response: "no_change",
      },
    });

    return {
      success: true,
      data: treatment,
    };
  } catch (error) {
    console.error("Error creating treatment:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: "Failed to create treatment",
    };
  }
}

export async function updateTreatment(id: string, data: any): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const validatedData = TreatmentSchema.partial().parse(data);
    
    const updateData: any = {};
    if (validatedData.flockId) updateData.flockId = validatedData.flockId;
    if (validatedData.disease) updateData.disease = validatedData.disease;
    if (validatedData.diseaseName) updateData.diseaseName = validatedData.diseaseName;
    if (validatedData.medication) updateData.medication = validatedData.medication;
    if (validatedData.dosage) updateData.dosage = validatedData.dosage;
    if (validatedData.frequency) updateData.frequency = validatedData.frequency;
    if (validatedData.duration) updateData.duration = validatedData.duration;
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.notes) updateData.notes = validatedData.notes;
    if (validatedData.symptoms) updateData.symptoms = validatedData.symptoms;
    if (validatedData.treatedBy) updateData.treatedById = validatedData.treatedBy;

    const treatment = await prisma.treatments.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: treatment,
    };
  } catch (error) {
    console.error("Error updating treatment:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: "Failed to update treatment",
    };
  }
}

export async function updateTreatmentResponse(id: string, response: string): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const treatment = await prisma.treatments.update({
      where: { id },
      data: {
        response: response as any,
      },
    });

    return {
      success: true,
      data: treatment,
    };
  } catch (error) {
    console.error("Error updating treatment response:", error);
    return {
      success: false,
      error: "Failed to update treatment response",
    };
  }
}

export async function deleteTreatment(id: string): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    await prisma.treatments.delete({
      where: { id },
    });

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Error deleting treatment:", error);
    return {
      success: false,
      error: "Failed to delete treatment",
    };
  }
}


// Mortality Management
export async function getMortalityRecords(
  page: number = 1,
  limit: number = 10,
  search?: string,
  cause?: string,
  status?: string
): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { causeDescription: { contains: search, mode: "insensitive" } },
        { flockId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (cause && cause !== "all") {
      where.cause = cause;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const [records, total] = await Promise.all([
      prisma.mortality.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          flock: {
            select: {
              id: true,
              batchCode: true,
              arrivalDate: true,
              ageInDays: true,
            }
          },
          recordedBy: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      prisma.mortality.count({ where }),
    ]);

    return {
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching mortality records:", error);
    return {
      success: false,
      error: "Failed to fetch mortality records",
    };
  }
}

export async function createMortalityRecord(data: any): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const validatedData = MortalitySchema.parse(data);
    
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get current flock data
      const flock = await tx.flocks.findUnique({
        where: { id: validatedData.flockId },
        select: { currentCount: true, initialCount: true }
      });

      if (!flock) {
        throw new Error("Flock not found");
      }

      // Check if we have enough birds to remove
      if (flock.currentCount < validatedData.count) {
        throw new Error(`Cannot remove ${validatedData.count} birds. Only ${flock.currentCount} birds available.`);
      }

      // Create mortality record
      const record = await tx.mortality.create({
        data: {
          flockId: validatedData.flockId,
          date: new Date(validatedData.date),
          count: validatedData.count,
          cause: validatedData.cause,
          causeDescription: validatedData.causeDescription,
          recordedById: validatedData.recordedBy,
        },
      });

      // Update flock current count
      const updatedFlock = await tx.flocks.update({
        where: { id: validatedData.flockId },
        data: {
          currentCount: flock.currentCount - validatedData.count,
        },
      });

      return { record, updatedFlock };
    });

    return {
      success: true,
      data: result.record,
    };
  } catch (error) {
    console.error("Error creating mortality record:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create mortality record",
    };
  }
}

export async function updateMortalityRecord(id: string, data: any): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const validatedData = MortalitySchema.partial().parse(data);
    
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get current mortality record
      const currentRecord = await tx.mortality.findUnique({
        where: { id },
        select: { count: true, flockId: true }
      });

      if (!currentRecord) {
        throw new Error("Mortality record not found");
      }

      // Get current flock data
      const flock = await tx.flocks.findUnique({
        where: { id: currentRecord.flockId },
        select: { currentCount: true, initialCount: true }
      });

      if (!flock) {
        throw new Error("Flock not found");
      }

      // Calculate count difference
      const countDifference = (validatedData.count || currentRecord.count) - currentRecord.count;
      const newFlockCount = flock.currentCount - countDifference;

      // Check if we have enough birds
      if (newFlockCount < 0) {
        throw new Error(`Cannot update. Would result in negative flock count.`);
      }

      // Update mortality record
      const updateData: any = {};
      if (validatedData.flockId) updateData.flockId = validatedData.flockId;
      if (validatedData.date) updateData.date = new Date(validatedData.date);
      if (validatedData.count) updateData.count = validatedData.count;
      if (validatedData.cause) updateData.cause = validatedData.cause;
      if (validatedData.causeDescription) updateData.causeDescription = validatedData.causeDescription;
      if (validatedData.recordedBy) updateData.recordedById = validatedData.recordedBy;

      const record = await tx.mortality.update({
        where: { id },
        data: updateData,
      });

      // Update flock current count if count changed
      if (countDifference !== 0) {
        await tx.flocks.update({
          where: { id: currentRecord.flockId },
          data: {
            currentCount: newFlockCount,
          },
        });
      }

      return record;
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error updating mortality record:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update mortality record",
    };
  }
}

export async function deleteMortalityRecord(id: string): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get mortality record data before deletion
      const mortalityRecord = await tx.mortality.findUnique({
        where: { id },
        select: { count: true, flockId: true }
      });

      if (!mortalityRecord) {
        throw new Error("Mortality record not found");
      }

      // Get current flock data
      const flock = await tx.flocks.findUnique({
        where: { id: mortalityRecord.flockId },
        select: { currentCount: true, initialCount: true }
      });

      if (!flock) {
        throw new Error("Flock not found");
      }

      // Calculate new flock count (restore the birds)
      const newFlockCount = flock.currentCount + mortalityRecord.count;

      // Check if restoring would exceed initial count
      if (newFlockCount > flock.initialCount) {
        throw new Error(`Cannot delete. Would result in flock count exceeding initial count.`);
      }

      // Delete mortality record
      await tx.mortality.delete({
        where: { id },
      });

      // Restore flock current count
      await tx.flocks.update({
        where: { id: mortalityRecord.flockId },
        data: {
          currentCount: newFlockCount,
        },
      });

      return { id, restoredCount: mortalityRecord.count };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error deleting mortality record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete mortality record",
    };
  }
}

