import { Logger } from '@nestjs/common';
import { Relay } from 'nostr-tools/relay';
import type { Event } from 'nostr-tools/core';
import {
  RelayConnection,
  RelaySubscriptionConfig,
  DEFAULT_SUBSCRIPTION_CONFIG,
} from '../types/relay-connection.types';

/**
 * Event handlers for relay subscription events.
 */
export interface RelayEventHandlers {
  onEvent: (event: Event, relayUrl: string) => Promise<void>;
  onEose: (relayUrl: string) => Promise<void>;
}

/**
 * Manages individual relay connection lifecycle and subscriptions.
 */
export class RelayConnectionManager {
  private readonly logger: Logger;
  private readonly reconnectDelayMs: number;

  constructor(loggerContext: string, reconnectDelayMs: number = 5000) {
    this.logger = new Logger(loggerContext);
    this.reconnectDelayMs = reconnectDelayMs;
  }

  /**
   * Establishes a connection to a relay and sets up event handlers.
   *
   * @param url - Relay WebSocket URL
   * @param isShuttingDown - Function to check if system is shutting down
   * @param onReconnectNeeded - Callback when reconnection should be scheduled
   * @param initialTimestamp - Optional initial timestamp from database for resuming sync
   * @returns RelayConnection object or null if connection failed
   */
  async connect(
    url: string,
    isShuttingDown: () => boolean,
    onReconnectNeeded: (url: string) => void,
    initialTimestamp: number | null = null,
  ): Promise<RelayConnection | null> {
    if (isShuttingDown()) {
      return null;
    }

    try {
      this.logger.log(`Attempting to connect to relay: ${url}`);
      const relay = await Relay.connect(url);

      const connection: RelayConnection = {
        relay,
        subscription: null,
        reconnectTimeout: null,
        url,
        lastEventTimestamp: initialTimestamp,
      };

      this.setupRelayHandlers(relay, url, isShuttingDown, onReconnectNeeded);

      this.logger.log(`Connected to relay: ${url}`);
      return connection;
    } catch (error) {
      this.logger.error(
        `Failed to connect to relay ${url}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  /**
   * Sets up event handlers for relay connection lifecycle.
   */
  private setupRelayHandlers(
    relay: Relay,
    url: string,
    isShuttingDown: () => boolean,
    onReconnectNeeded: (url: string) => void,
  ): void {
    relay.onclose = () => {
      this.logger.warn(`Disconnected from relay: ${url}`);
      if (!isShuttingDown()) {
        onReconnectNeeded(url);
      }
    };

    relay.onnotice = (msg: string) => {
      this.logger.warn(`Relay notice from ${url}: ${msg}`);
    };
  }

  /**
   * Subscribes to events from a relay connection.
   *
   * @param connection - Active relay connection
   * @param handlers - Event handlers for subscription events
   * @param config - Subscription configuration (defaults to OER events)
   */
  subscribe(
    connection: RelayConnection,
    handlers: RelayEventHandlers,
    config: RelaySubscriptionConfig = DEFAULT_SUBSCRIPTION_CONFIG,
  ): void {
    if (!connection.relay) {
      this.logger.warn(
        `Cannot subscribe to relay ${connection.url}: relay is null`,
      );
      return;
    }

    try {
      // Build filter with optional 'since' parameter for reconnections
      const filter: { kinds: number[]; since?: number } = {
        kinds: config.kinds,
      };

      // On reconnection, only fetch events since the last received event
      if (connection.lastEventTimestamp !== null) {
        // Add 1 to avoid re-fetching the last event (since is inclusive)
        // Use Math.floor to ensure integer timestamp for relay compatibility
        filter.since = Math.floor(connection.lastEventTimestamp) + 1;
        this.logger.log(
          `Subscribing to relay ${connection.url} with since=${filter.since} (last event: ${connection.lastEventTimestamp})`,
        );
      } else {
        this.logger.log(
          `Initial subscription to relay ${connection.url} (fetching all events)`,
        );
      }

      connection.subscription = connection.relay.subscribe([filter], {
        onevent: (event: Event) => {
          handlers.onEvent(event, connection.url).catch((err) => {
            this.logger.error(
              `Error in event handler for relay ${connection.url}: ${err}`,
              err instanceof Error ? err.stack : undefined,
            );
          });
        },
        oneose: () => {
          this.logger.log(
            `End of stored events (EOSE) received from ${connection.url}`,
          );
          handlers.onEose(connection.url).catch((err) => {
            this.logger.error(
              `Error in EOSE handler for relay ${connection.url}: ${err}`,
              err instanceof Error ? err.stack : undefined,
            );
          });
        },
      });

      this.logger.log(`Subscribed to relay events: ${connection.url}`);
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to relay ${connection.url}: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Schedules a reconnection attempt for a relay.
   *
   * @param url - Relay URL to reconnect to
   * @param connections - Map of active connections
   * @param isShuttingDown - Function to check if system is shutting down
   * @param reconnectCallback - Callback to execute reconnection
   * @returns The scheduled timeout or null if already scheduled/shutting down
   */
  scheduleReconnect(
    url: string,
    connections: Map<string, RelayConnection>,
    isShuttingDown: () => boolean,
    reconnectCallback: (url: string) => Promise<void>,
  ): NodeJS.Timeout | null {
    if (isShuttingDown()) {
      return null;
    }

    const connection = connections.get(url);
    if (connection?.reconnectTimeout) {
      // Already scheduled
      return null;
    }

    this.logger.log(
      `Scheduling reconnection for ${url} in ${this.reconnectDelayMs}ms...`,
    );

    const timeout = setTimeout(() => {
      const conn = connections.get(url);
      if (conn) {
        conn.reconnectTimeout = null;
      }
      void reconnectCallback(url);
    }, this.reconnectDelayMs);

    // Store timeout or create minimal connection entry
    if (connection) {
      connection.reconnectTimeout = timeout;
    } else {
      connections.set(url, {
        relay: null,
        subscription: null,
        reconnectTimeout: timeout,
        url,
        lastEventTimestamp: null,
      });
    }

    return timeout;
  }

  /**
   * Closes a relay connection and cleans up resources.
   *
   * @param connection - Connection to close
   */
  closeConnection(connection: RelayConnection): void {
    this.logger.log(`Closing connection to relay: ${connection.url}`);

    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
      connection.reconnectTimeout = null;
    }

    if (connection.subscription) {
      connection.subscription.close();
      connection.subscription = null;
    }

    if (connection.relay) {
      connection.relay.close();
    }
  }
}
