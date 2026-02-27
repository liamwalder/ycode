/**
 * Server-side Supabase Realtime broadcast for MCP changes.
 *
 * Sends messages on the same channels that the browser collaboration
 * hooks (use-live-layer-updates, use-live-page-updates) listen on,
 * so the editor UI updates in real time when an AI agent makes changes.
 */

import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { Layer, Page } from '@/types';

const MCP_USER_ID = '__mcp_agent__';

async function broadcast(
  channelName: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const client = await getSupabaseAdmin();
    if (!client) return;

    const channel = client.channel(channelName);

    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        else if (status === 'CHANNEL_ERROR') reject(new Error('Channel error'));
      });
    });

    await channel.send({ type: 'broadcast', event, payload });
    await channel.unsubscribe();
  } catch (error) {
    console.error(`[MCP-BROADCAST] Failed to broadcast ${event}:`, error);
  }
}

/**
 * Broadcast a full layer tree replacement to browser clients.
 * The hook picks this up via `layers_full_sync` and calls setDraftLayers.
 */
export async function broadcastLayersChanged(
  pageId: string,
  layers: Layer[],
): Promise<void> {
  await broadcast(`page:${pageId}:updates`, 'layers_full_sync', {
    page_id: pageId,
    layers,
    user_id: MCP_USER_ID,
    timestamp: Date.now(),
  });
}

export async function broadcastPageCreated(page: Page): Promise<void> {
  await broadcast('pages:updates', 'page_created', page as unknown as Record<string, unknown>);
}

export async function broadcastPageUpdated(
  pageId: string,
  changes: Partial<Page>,
): Promise<void> {
  await broadcast('pages:updates', 'page_update', {
    page_id: pageId,
    user_id: MCP_USER_ID,
    changes,
    timestamp: Date.now(),
  });
}

export async function broadcastPageDeleted(pageId: string): Promise<void> {
  await broadcast('pages:updates', 'page_deleted', {
    pageId,
    user_id: MCP_USER_ID,
    timestamp: Date.now(),
  });
}
