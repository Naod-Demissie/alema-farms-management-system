import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { administeredDate } = body;

    if (!administeredDate) {
      return NextResponse.json(
        { error: 'Administered date is required' },
        { status: 400 }
      );
    }

    // Update the vaccination record
    const updatedVaccination = await prisma.vaccinations.update({
      where: { id },
      data: {
        administeredDate: new Date(administeredDate),
        isScheduled: false, // Mark as no longer scheduled since it's completed
        status: "completed", // Ensure status is set to completed
      },
      include: {
        flock: {
          select: {
            batchCode: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVaccination,
      message: 'Vaccination marked as completed successfully',
    });
  } catch (error) {
    console.error('Error marking vaccination as completed:', error);
    return NextResponse.json(
      { error: 'Failed to mark vaccination as completed' },
      { status: 500 }
    );
  }
}
