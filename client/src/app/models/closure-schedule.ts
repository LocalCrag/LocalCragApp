export type ClosureScheduleType = 'ANNUAL' | 'PERMANENT' | 'FIXED';

export class ClosureSchedule {
  id: string | null = null;
  scheduleType: ClosureScheduleType;
  reason: string | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  startMonth: number | null = null;
  startDay: number | null = null;
  endMonth: number | null = null;
  endDay: number | null = null;

  public static deserialize(payload: any): ClosureSchedule {
    const schedule = new ClosureSchedule();
    schedule.id = payload.id ?? null;
    schedule.scheduleType = payload.scheduleType;
    schedule.reason = payload.reason ?? null;
    schedule.startDate = payload.startDate ?? null;
    schedule.endDate = payload.endDate ?? null;
    schedule.startMonth = payload.startMonth ?? null;
    schedule.startDay = payload.startDay ?? null;
    schedule.endMonth = payload.endMonth ?? null;
    schedule.endDay = payload.endDay ?? null;
    return schedule;
  }

  public static serialize(schedule: ClosureSchedule): any {
    const payload: Record<string, unknown> = {
      id: schedule.id,
      scheduleType: schedule.scheduleType,
      reason: schedule.reason,
    };
    if (schedule.scheduleType === 'ANNUAL') {
      payload.startMonth = schedule.startMonth;
      payload.startDay = schedule.startDay;
      payload.endMonth = schedule.endMonth;
      payload.endDay = schedule.endDay;
    }
    if (schedule.scheduleType === 'FIXED') {
      payload.startDate = schedule.startDate;
      payload.endDate = schedule.endDate;
    }
    return payload;
  }
}
