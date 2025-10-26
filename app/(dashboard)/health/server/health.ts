"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

// Validation schemas
const VaccinationSchema = z.object({
  vaccineName: z.string().min(1, "Vaccine name is required"),
  flockId: z.string().min(1, "Flock ID is required"),
  administeredDate: z.string().optional(),
  scheduledDate: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  dosage: z.string().min(1, "Dosage is required"),
  dosageUnit: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional().default("completed"),
  administrationMethod: z.enum(["INJECTION", "DRINKING_WATER", "SPRAY", "OTHER"]).optional(),
  isScheduled: z.boolean().optional().default(false),
  reminderEnabled: z.boolean().optional().default(false),
  reminderDaysBefore: z.number().optional(),
  sendEmail: z.boolean().optional().default(false),
  sendInAppAlert: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.number().optional(),
  recurringEndDate: z.string().optional(),
});

const TreatmentSchema = z.object({
  flockId: z.string().min(1, "Flock ID is required"),
  disease: z.enum(["respiratory", "digestive", "parasitic", "nutritional", "other"]),
  diseaseName: z.string().min(1, "Disease name is required"),
  diseasedBirdsCount: z.number().min(1, "Number of diseased birds must be at least 1"),
  medication: z.string().min(1, "Medication is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
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
    
    // Determine the correct date and status
    const isScheduled = validatedData.isScheduled || false;
    const dateToUse = isScheduled ? validatedData.scheduledDate : validatedData.administeredDate;
    
    if (!dateToUse) {
      return {
        success: false,
        error: "Either administered date or scheduled date is required",
      };
    }

    // Calculate next scheduled date for recurring vaccinations
    let nextScheduledDate = null;
    if (isScheduled && validatedData.isRecurring && validatedData.recurringInterval) {
      const baseDate = new Date(dateToUse);
      nextScheduledDate = new Date(baseDate);
      nextScheduledDate.setDate(nextScheduledDate.getDate() + validatedData.recurringInterval);
    }
    
    const vaccination = await prisma.vaccinations.create({
      data: {
        vaccineName: validatedData.vaccineName,
        flockId: validatedData.flockId,
        quantity: validatedData.quantity,
        dosage: validatedData.dosage,
        dosageUnit: validatedData.dosageUnit,
        notes: validatedData.notes,
        status: isScheduled ? "scheduled" : "completed",
        administeredDate: new Date(dateToUse),
        administrationMethod: validatedData.administrationMethod,
        isScheduled: isScheduled,
        scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null,
        reminderEnabled: validatedData.reminderEnabled || false,
        reminderDaysBefore: validatedData.reminderDaysBefore,
        sendEmail: validatedData.sendEmail || false,
        sendInAppAlert: validatedData.sendInAppAlert || false,
        isRecurring: validatedData.isRecurring || false,
        recurringInterval: validatedData.recurringInterval,
        recurringEndDate: validatedData.recurringEndDate ? new Date(validatedData.recurringEndDate) : null,
        nextScheduledDate: nextScheduledDate,
      },
    });

    // Create reminder record if reminder is enabled
    if (isScheduled && validatedData.reminderEnabled && validatedData.reminderDaysBefore && validatedData.scheduledDate) {
      const scheduledDate = new Date(validatedData.scheduledDate);
      const reminderDate = new Date(scheduledDate);
      reminderDate.setDate(reminderDate.getDate() - validatedData.reminderDaysBefore);

      await prisma.vaccinationReminders.create({
        data: {
          vaccinationId: vaccination.id,
          reminderDate: reminderDate,
        },
      });
    }

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

// Mark scheduled vaccination as completed
export async function markVaccinationAsCompleted(id: string, administeredDate: string): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const vaccination = await prisma.vaccinations.findUnique({
      where: { id },
    });

    if (!vaccination) {
      return {
        success: false,
        message: "Vaccination not found"
      };
    }

    if (!vaccination.isScheduled) {
      return {
        success: false,
        message: "Vaccination is already completed"
      };
    }

    // Update vaccination to completed status
    const updated = await prisma.vaccinations.update({
      where: { id },
      data: {
        isScheduled: false,
        status: "completed",
        administeredDate: new Date(administeredDate),
      },
    });

    // If this is a recurring vaccination, create the next occurrence
    if (vaccination.isRecurring && vaccination.recurringInterval && vaccination.scheduledDate) {
      const nextDate = new Date(vaccination.scheduledDate);
      nextDate.setDate(nextDate.getDate() + vaccination.recurringInterval);

      // Check if we should create next occurrence (within end date if set)
      const shouldCreateNext = !vaccination.recurringEndDate || nextDate <= vaccination.recurringEndDate;

      if (shouldCreateNext) {
        const nextScheduledDate = new Date(nextDate);
        nextScheduledDate.setDate(nextScheduledDate.getDate() + vaccination.recurringInterval);

        const nextVaccination = await prisma.vaccinations.create({
          data: {
            vaccineName: vaccination.vaccineName,
            flockId: vaccination.flockId,
            quantity: vaccination.quantity,
            dosage: vaccination.dosage,
            dosageUnit: vaccination.dosageUnit,
            notes: vaccination.notes,
            status: "scheduled",
            administeredDate: nextDate,
            administrationMethod: vaccination.administrationMethod,
            isScheduled: true,
            scheduledDate: nextDate,
            reminderEnabled: vaccination.reminderEnabled,
            reminderDaysBefore: vaccination.reminderDaysBefore,
            sendEmail: vaccination.sendEmail,
            sendInAppAlert: vaccination.sendInAppAlert,
            isRecurring: true,
            recurringInterval: vaccination.recurringInterval,
            recurringEndDate: vaccination.recurringEndDate,
            parentVaccinationId: vaccination.parentVaccinationId || vaccination.id,
            nextScheduledDate: nextScheduledDate,
          },
        });

        // Create reminder for next occurrence
        if (vaccination.reminderEnabled && vaccination.reminderDaysBefore) {
          const reminderDate = new Date(nextDate);
          reminderDate.setDate(reminderDate.getDate() - vaccination.reminderDaysBefore);

          await prisma.vaccinationReminders.create({
            data: {
              vaccinationId: nextVaccination.id,
              reminderDate: reminderDate,
            },
          });
        }
      }
    }

    return {
      success: true,
      data: updated,
      message: "Vaccination marked as completed"
    };
  } catch (error) {
    console.error("Error marking vaccination as completed:", error);
    return {
      success: false,
      message: "Failed to mark vaccination as completed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get scheduled vaccinations
export async function getScheduledVaccinations(): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const vaccinations = await prisma.vaccinations.findMany({
      where: {
        isScheduled: true,
        status: "scheduled",
      },
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return {
      success: true,
      data: vaccinations,
    };
  } catch (error) {
    console.error("Error fetching scheduled vaccinations:", error);
    return {
      success: false,
      message: "Failed to fetch scheduled vaccinations",
      error: error instanceof Error ? error.message : "Unknown error",
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
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        treatedById: authResult.user.id, // Use current authenticated user
        response: "no_change",
        // Initialize status tracking fields
        stillSickCount: validatedData.diseasedBirdsCount, // Initially all diseased birds are still sick
        deceasedCount: 0,
        recoveredCount: 0,
        lastStatusUpdate: new Date(),
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
    if (validatedData.diseasedBirdsCount !== undefined) {
      updateData.diseasedBirdsCount = validatedData.diseasedBirdsCount;
      // If diseased birds count is being updated, we need to adjust stillSickCount accordingly
      // Get current treatment to calculate the adjustment
      const currentTreatment = await prisma.treatments.findUnique({
        where: { id },
        select: { diseasedBirdsCount: true, stillSickCount: true, deceasedCount: true, recoveredCount: true }
      });
      
      if (currentTreatment) {
        const currentStillSick = currentTreatment.stillSickCount || 0;
        const currentDeceased = currentTreatment.deceasedCount || 0;
        const currentRecovered = currentTreatment.recoveredCount || 0;
        const currentTotal = currentStillSick + currentDeceased + currentRecovered;
        
        // Calculate the difference and adjust stillSickCount proportionally
        const newTotal = validatedData.diseasedBirdsCount;
        const difference = newTotal - currentTotal;
        
        // Add the difference to stillSickCount (assuming new cases are still sick)
        updateData.stillSickCount = Math.max(0, currentStillSick + difference);
        updateData.lastStatusUpdate = new Date();
      }
    }
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

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get treatment data before deletion
      const treatment = await tx.treatments.findUnique({
        where: { id },
        select: { 
          deceasedCount: true, 
          flockId: true,
          id: true 
        }
      });

      if (!treatment) {
        throw new Error("Treatment not found");
      }

      // If there are deceased birds, restore them to flock count
      if (treatment.deceasedCount && treatment.deceasedCount > 0) {
        // Get current flock data
        const flock = await tx.flocks.findUnique({
          where: { id: treatment.flockId },
          select: { currentCount: true, initialCount: true }
        });

        if (flock) {
          // Calculate new flock count (restore the birds)
          const newFlockCount = flock.currentCount + treatment.deceasedCount;

          // Check if restoring would exceed initial count
          if (newFlockCount > flock.initialCount) {
            throw new Error(`Cannot delete. Would result in flock count exceeding initial count.`);
          }

          // Restore birds to flock
          await tx.flocks.update({
            where: { id: treatment.flockId },
            data: {
              currentCount: newFlockCount
            }
          });
        }
      }

      // Delete associated mortality records created from this treatment
      await tx.mortality.deleteMany({
        where: {
          treatmentId: id
        }
      });

      // Delete the treatment record
      await tx.treatments.delete({
        where: { id },
      });

      return { id };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error deleting treatment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete treatment",
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
          recordedById: authResult.user.id, // Use current authenticated user
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
        select: { count: true, flockId: true, treatmentId: true }
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

      // If this mortality record is from a treatment, update the treatment's deceased count
      if (mortalityRecord.treatmentId) {
        await tx.treatments.update({
          where: { id: mortalityRecord.treatmentId },
          data: {
            deceasedCount: {
              decrement: mortalityRecord.count
            }
          }
        });
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

// Treatment Status Update Management
// Utility function to fix existing treatments with incorrect stillSickCount
export async function fixTreatmentStillSickCount(): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    // Find treatments where stillSickCount is 0 but should be equal to diseasedBirdsCount
    const treatmentsToFix = await prisma.treatments.findMany({
      where: {
        stillSickCount: 0,
        diseasedBirdsCount: { gt: 0 },
        deceasedCount: 0,
        recoveredCount: 0,
      },
      select: {
        id: true,
        diseasedBirdsCount: true,
        stillSickCount: true,
        deceasedCount: true,
        recoveredCount: true,
      }
    });

    if (treatmentsToFix.length === 0) {
      return {
        success: true,
        message: "No treatments need fixing",
        data: { fixedCount: 0 }
      };
    }

    // Update treatments to set stillSickCount equal to diseasedBirdsCount
    const updatePromises = treatmentsToFix.map(treatment => 
      prisma.treatments.update({
        where: { id: treatment.id },
        data: {
          stillSickCount: treatment.diseasedBirdsCount,
          lastStatusUpdate: new Date(),
        }
      })
    );

    await Promise.all(updatePromises);

    return {
      success: true,
      message: `Fixed ${treatmentsToFix.length} treatments`,
      data: { fixedCount: treatmentsToFix.length }
    };
  } catch (error) {
    console.error("Error fixing treatment stillSickCount:", error);
    return {
      success: false,
      error: "Failed to fix treatment stillSickCount",
    };
  }
}

export async function updateTreatmentStatus(id: string, data: any): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const validatedData = z.object({
      deceasedCount: z.number().min(0),
      recoveredCount: z.number().min(0),
      stillSickCount: z.number().min(0),
      statusUpdateNotes: z.string().optional(),
    }).parse(data);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get current treatment data
      const currentTreatment = await tx.treatments.findUnique({
        where: { id },
        select: { 
          diseasedBirdsCount: true, 
          flockId: true,
          deceasedCount: true,
          recoveredCount: true,
          stillSickCount: true
        }
      });

      if (!currentTreatment) {
        throw new Error("Treatment not found");
      }

      // Calculate the difference in deceased count for mortality records
      const deceasedDifference = validatedData.deceasedCount - (currentTreatment.deceasedCount || 0);
      
      // Update treatment record
      const updatedTreatment = await tx.treatments.update({
        where: { id },
        data: {
          deceasedCount: validatedData.deceasedCount,
          recoveredCount: validatedData.recoveredCount,
          stillSickCount: validatedData.stillSickCount,
          statusUpdateNotes: validatedData.statusUpdateNotes,
          lastStatusUpdate: new Date(),
          // Update response based on recovery rate
          response: validatedData.recoveredCount > 0 ? "improved" : 
                   validatedData.stillSickCount === 0 ? "improved" : "no_change"
        },
      });

      // If there are new deaths, create mortality records
      if (deceasedDifference > 0) {
        await tx.mortality.create({
          data: {
            flockId: currentTreatment.flockId,
            treatmentId: id,
            date: new Date(),
            count: deceasedDifference,
            cause: "disease",
            causeDescription: `Disease-related deaths from treatment ${id}`,
          },
        });

        // Update flock current count
        await tx.flocks.update({
          where: { id: currentTreatment.flockId },
          data: {
            currentCount: {
              decrement: deceasedDifference
            }
          }
        });
      }

      return updatedTreatment;
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error updating treatment status:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update treatment status",
    };
  }
}

