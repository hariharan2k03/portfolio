import { detections, type DetectionKey } from './attack';
import { bus, session, type Alert } from '../core/state';

let nextId = 1;

/** Raise a SOC alert for a terminal action. Every command calls this. */
export function detect(key: DetectionKey, command: string, arg = ''): Alert {
  const d = detections[key];
  const alert: Alert = {
    id: nextId++,
    time: new Date(),
    command,
    technique: d.technique,
    name: d.name,
    tactic: d.tactic,
    severity: d.severity,
    description: d.description.replace('{arg}', arg || '—'),
    note: d.note,
    query: d.query,
  };
  session.alerts.push(alert);
  bus.emit('alert', alert);
  return alert;
}
