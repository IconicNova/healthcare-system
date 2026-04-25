import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StaffProfile from '@/components/staff/StaffProfile';

export default async function StaffProfilePage({ params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session || !session.user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Unauthorized</p>
      </div>
    );
  }

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        skills: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        certifications: {
          select: {
            id: true,
            name: true,
            issuedBy: true,
            issueDate: true,
            expiryDate: true,
          },
        },
      },
    });

    if (!staff) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p>Staff member not found</p>
        </div>
      );
    }

    const staffData = {
      ...staff,
      fullName: `${staff.firstName} ${staff.lastName}`,
    };

    return <StaffProfile staffData={staffData} />;
  } catch (error) {
    console.error('Error fetching staff profile:', error);
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Error loading staff profile</p>
      </div>
    );
  }
}
