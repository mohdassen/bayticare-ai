import { Asset, MaintenanceEvent } from '@prisma/client';
export type HealthBreakdown = { score:number; maintenance:number; assets:number; warranty:number; penalties:number; reasons:string[] };
export function calculateHomeHealth(assets: Asset[], maintenance: MaintenanceEvent[], now = new Date()): HealthBreakdown {
  if (!assets.length) return { score: 50, maintenance: 0, assets: 20, warranty: 0, penalties: 0, reasons: ['Add assets to improve accuracy'] };
  const overdue = maintenance.filter(m => !m.completedAt && m.dueAt < now).length;
  const completed = maintenance.filter(m => !!m.completedAt).length;
  const maintenanceScore = Math.min(40, completed * 5 + Math.max(0, 20 - overdue * 6));
  const healthy = assets.filter(a => ['NEW','HEALTHY'].includes(a.status)).length;
  const assetScore = Math.round((healthy / assets.length) * 35);
  const covered = assets.filter(a => a.warrantyExpiresAt && a.warrantyExpiresAt > now).length;
  const warrantyScore = Math.round((covered / assets.length) * 15);
  const penalties = Math.min(25, overdue * 5 + assets.filter(a => ['REPAIR_REQUIRED','OVERDUE'].includes(a.status)).length * 5);
  const score = Math.max(0, Math.min(100, 10 + maintenanceScore + assetScore + warrantyScore - penalties));
  const reasons = [] as string[];
  if (overdue) reasons.push(`${overdue} overdue maintenance task(s)`);
  if (covered) reasons.push(`${covered} asset(s) under warranty`);
  if (!reasons.length) reasons.push('No urgent issues detected');
  return { score, maintenance: maintenanceScore, assets: assetScore, warranty: warrantyScore, penalties, reasons };
}
