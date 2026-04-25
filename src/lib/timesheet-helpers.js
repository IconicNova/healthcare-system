export async function hasTimesheetOverlap({
  prisma,
  organizationId,
  staffId,
  startDate,
  endDate,
  excludeId = null,
}) {
  const overlap = await prisma.timesheet.findFirst({
    where: {
      organizationId,
      staffId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true },
  });

  return Boolean(overlap);
}
