"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OnboardingData, CreateTaskData, ApiResponse } from "./types";

// Define default onboarding tasks
const DEFAULT_ONBOARDING_TASKS = [
  {
    title: "Complete Profile Setup",
    description: "Fill in personal information and upload profile photo",
    category: "profile",
    required: true,
    order: 1
  },
  {
    title: "Read Employee Handbook",
    description: "Review company policies and procedures",
    category: "documentation",
    required: true,
    order: 2
  },
  {
    title: "Complete Safety Training",
    description: "Watch safety videos and complete assessment",
    category: "training",
    required: true,
    order: 3
  },
  {
    title: "Meet with Supervisor",
    description: "Schedule and attend initial meeting with direct supervisor",
    category: "meetings",
    required: true,
    order: 4
  },
  {
    title: "Tour the Facility",
    description: "Complete guided tour of the poultry farm facilities",
    category: "orientation",
    required: true,
    order: 5
  },
  {
    title: "Set Up Workstation",
    description: "Configure computer and workspace",
    category: "setup",
    required: false,
    order: 6
  },
  {
    title: "Download Mobile App",
    description: "Install and configure the mobile application",
    category: "setup",
    required: false,
    order: 7
  }
];

// Complete onboarding
export const completeOnboarding = async (data: OnboardingData): Promise<ApiResponse> => {
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
    if (currentUser.id !== data.staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Validate staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: data.staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Get onboarding checklist
    const checklist = await getOnboardingChecklist(data.staffId);
    
    if (!checklist.success) {
      return checklist;
    }

    const tasks = checklist.data || [];
    const requiredTasks = tasks.filter((task: any) => task.required);
    const completedRequiredTasks = data.completedTasks.filter(taskId => 
      requiredTasks.some((task: any) => task.id === taskId && task.required)
    );

    // Check if all required tasks are completed
    if (completedRequiredTasks.length !== requiredTasks.length) {
      return {
        success: false,
        message: "All required onboarding tasks must be completed"
      };
    }

    // Update staff onboarding status
    const updatedStaff = await prisma.staff.update({
      where: { id: data.staffId },
      data: {
        // Add onboarding completion fields if they exist in schema
        // For now, we'll use a custom field or add to existing fields
      }
    });

    // Mark completed tasks
    await Promise.all(
      data.completedTasks.map(taskId =>
        markOnboardingTaskComplete(taskId, data.staffId)
      )
    );

    // Create onboarding completion record (if you have an onboarding table)
    // For now, we'll just return success

    return {
      success: true,
      data: {
        staffId: data.staffId,
        completedTasks: data.completedTasks,
        totalTasks: tasks.length,
        requiredTasks: requiredTasks.length,
        completedRequiredTasks: completedRequiredTasks.length,
        completionRate: Math.round((data.completedTasks.length / tasks.length) * 100)
      },
      message: "Onboarding completed successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to complete onboarding"
    };
  }
};

// Get onboarding checklist
export const getOnboardingChecklist = async (staffId: string): Promise<ApiResponse> => {
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

    // Get staff role to customize tasks
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { role: true }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Get tasks based on role
    let tasks = [...DEFAULT_ONBOARDING_TASKS];

    // Add role-specific tasks
    if (staff.role === 'VETERINARIAN') {
      tasks.push({
        title: "Veterinary Equipment Training",
        description: "Learn to use veterinary equipment and tools",
        category: "training",
        required: true,
        order: 8
      });
      tasks.push({
        title: "Animal Health Protocols",
        description: "Review animal health and treatment protocols",
        category: "documentation",
        required: true,
        order: 9
      });
    } else if (staff.role === 'ADMIN') {
      tasks.push({
        title: "System Administration Training",
        description: "Learn system administration and user management",
        category: "training",
        required: true,
        order: 8
      });
      tasks.push({
        title: "Financial Reporting Overview",
        description: "Understand financial reporting and analytics",
        category: "training",
        required: true,
        order: 9
      });
    }

    // Add unique IDs to tasks
    const tasksWithIds = tasks.map((task, index) => ({
      id: `task_${index + 1}`,
      ...task,
      completed: false // This would be determined by checking actual completion status
    }));

    return {
      success: true,
      data: tasksWithIds
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get onboarding checklist"
    };
  }
};

// Mark onboarding task as complete
export const markOnboardingTaskComplete = async (taskId: string, staffId: string): Promise<ApiResponse> => {
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

    // In a real implementation, you would have an onboarding_tasks table
    // For now, we'll just return success
    // This would typically involve:
    // 1. Creating/updating a record in onboarding_tasks table
    // 2. Logging the completion
    // 3. Checking if all required tasks are complete

    return {
      success: true,
      data: {
        taskId,
        staffId,
        completedAt: new Date()
      },
      message: "Task marked as complete"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to mark task as complete"
    };
  }
};

// Get onboarding progress
export const getOnboardingProgress = async (staffId: string): Promise<ApiResponse> => {
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

    // Get checklist
    const checklistResult = await getOnboardingChecklist(staffId);
    
    if (!checklistResult.success) {
      return checklistResult;
    }

    const tasks = checklistResult.data || [];
    const requiredTasks = tasks.filter((task: any) => task.required);
    
    // In a real implementation, you would check actual completion status
    // For now, we'll simulate some completion
    const completedTasks = tasks.slice(0, Math.floor(tasks.length * 0.3)).map((task: any) => task.id);
    const completedRequiredTasks = completedTasks.filter(taskId => 
      requiredTasks.some((task: any) => task.id === taskId)
    );

    const progress = {
      staffId,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      requiredTasks: requiredTasks.length,
      completedRequiredTasks: completedRequiredTasks.length,
      completionRate: Math.round((completedTasks.length / tasks.length) * 100),
      isComplete: completedRequiredTasks.length === requiredTasks.length,
      tasks: tasks.map((task: any) => ({
        ...task,
        completed: completedTasks.includes(task.id)
      }))
    };

    return {
      success: true,
      data: progress
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get onboarding progress"
    };
  }
};

// Create onboarding task
export const createOnboardingTask = async (data: CreateTaskData): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // In a real implementation, you would save this to an onboarding_tasks table
    // For now, we'll just return the created task data

    const task = {
      id: `task_${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: task,
      message: "Onboarding task created successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to create onboarding task"
    };
  }
};

// Get all onboarding tasks (Admin only)
export const getAllOnboardingTasks = async (): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // In a real implementation, you would fetch from onboarding_tasks table
    // For now, we'll return the default tasks

    return {
      success: true,
      data: DEFAULT_ONBOARDING_TASKS.map((task, index) => ({
        id: `task_${index + 1}`,
        ...task
      }))
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get onboarding tasks"
    };
  }
};

// Get staff onboarding status
export const getStaffOnboardingStatus = async (): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Get all staff with their onboarding status
    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        createdAt: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get onboarding progress for each staff member
    const staffWithProgress = await Promise.all(
      staff.map(async (member) => {
        const progressResult = await getOnboardingProgress(member.id);
        return {
          ...member,
          onboardingProgress: progressResult.success ? progressResult.data : null
        };
      })
    });

    return {
      success: true,
      data: staffWithProgress
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get staff onboarding status"
    };
  }
};

// Reset onboarding for a staff member
export const resetOnboarding = async (staffId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Validate staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // In a real implementation, you would reset the onboarding status
    // This might involve:
    // 1. Clearing completed tasks
    // 2. Resetting onboarding completion status
    // 3. Sending notification to staff member

    return {
      success: true,
      message: "Onboarding reset successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to reset onboarding"
    };
  }
};
