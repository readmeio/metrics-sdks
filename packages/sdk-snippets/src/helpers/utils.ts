import type { ClientInfo, TargetId, TargetInfo } from '../targets/targets';
import { targets } from '../targets/targets';

export interface AvailableTarget extends TargetInfo {
  clients: ClientInfo[];
}

export const availableWebhookTargets = () =>
  Object.keys(targets).map<AvailableTarget>(targetId => ({
    ...targets[targetId as TargetId].info,
    clients: Object.keys(targets[targetId as TargetId].services.webhooks.clientsById).map(
      clientId => targets[targetId as TargetId].services.webhooks.clientsById[clientId].info
    ),
  }));

export const availableServerTargets = () =>
  Object.keys(targets).map<AvailableTarget>(targetId => ({
    ...targets[targetId as TargetId].info,
    clients: Object.keys(targets[targetId as TargetId].services.server.clientsById).map(
      clientId => targets[targetId as TargetId].services.server.clientsById[clientId].info
    ),
  }));

export const extname = (targetId: TargetId) => targets[targetId]?.info.extname || '';
