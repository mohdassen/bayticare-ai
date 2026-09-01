import { describe, it, expect } from 'vitest';
import { calculateHomeHealth } from '../lib/health';

describe('home health', () => {
  const now = new Date('2026-01-10');

  it('penalizes overdue maintenance', () => {
    const assets: any = [{ id: 'a1', status: 'HEALTHY', warrantyExpiresAt: new Date('2027-01-01'), maintenanceIntervalDays: 180 }];
    const clean: any = [];
    const bad: any = [{ assetId: 'a1', dueAt: new Date('2026-01-01'), completedAt: null }];
    expect(calculateHomeHealth(assets, bad, new Set(['a1']), now).score).toBeLessThan(calculateHomeHealth(assets, clean, new Set(['a1']), now).score);
  });

  it('penalizes expired warranty and missing docs', () => {
    const assets: any = [{ id: 'a1', status: 'HEALTHY', warrantyExpiresAt: new Date('2025-01-01'), maintenanceIntervalDays: 180 }];
    const withDocs = calculateHomeHealth(assets, [], new Set(['a1']), now);
    const withoutDocs = calculateHomeHealth(assets, [], new Set(), now);
    expect(withoutDocs.score).toBeLessThan(withDocs.score);
  });

  it('penalizes assets with no maintenance schedule', () => {
    const scheduled: any = [{ id: 'a1', status: 'HEALTHY', warrantyExpiresAt: null, maintenanceIntervalDays: 180 }];
    const unscheduled: any = [{ id: 'a1', status: 'HEALTHY', warrantyExpiresAt: null, maintenanceIntervalDays: null }];
    expect(calculateHomeHealth(unscheduled, [], new Set(['a1']), now).score).toBeLessThan(calculateHomeHealth(scheduled, [], new Set(['a1']), now).score);
  });

  it('maps score to the right Arabic status band', () => {
    expect(calculateHomeHealth([{ id: 'a1', status: 'HEALTHY', warrantyExpiresAt: null, maintenanceIntervalDays: 180 } as any], [], new Set(['a1']), now).status).toBe('ممتاز');
  });
});
