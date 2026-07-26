/**
 * Commit Event Publisher (In-Process Pub/Sub Mechanism)
 *
 * Purpose:
 *   Implements a lightweight, decoupled publish/subscribe distribution mechanism
 *   for immutable CommitEvents. Multiple downstream consumers (e.g., Graph Builder,
 *   Metrics Engine, Raw Event Store, AI Engine) can subscribe independently to
 *   receive every streamed event without the publisher knowing consumer identities.
 *
 * Why an in-process pub/sub is used:
 *   Decouples the streaming generator from downstream analytical consumers.
 *   Consumers can be attached or removed dynamically at runtime without altering
 *   the CommitStreamService or Git log traversal logic.
 */

import { CommitEvent } from './commit.event';
import { CommitEventConsumer } from './commit.types';

export class CommitEventPublisher {
  private readonly consumers: Set<CommitEventConsumer> = new Set();

  /**
   * Registers a consumer callback to receive published CommitEvents.
   *
   * @param consumer Callback function executed when an event is published.
   * @returns An unsubscribe function / token.
   */
  subscribe(consumer: CommitEventConsumer): () => void {
    this.consumers.add(consumer);
    return () => {
      this.unsubscribe(consumer);
    };
  }

  /**
   * Unregisters a previously subscribed consumer callback.
   *
   * @param consumer The exact callback reference passed to subscribe().
   * @returns True if removed, false if not found.
   */
  unsubscribe(consumer: CommitEventConsumer): boolean {
    return this.consumers.delete(consumer);
  }

  /**
   * Publishes an immutable CommitEvent to all registered consumers concurrently.
   * Awaits all async consumers to ensure backpressure is honored upstream.
   *
   * @param event The immutable CommitEvent to distribute.
   */
  async publish(event: CommitEvent): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const consumer of this.consumers) {
      try {
        const result = consumer(event);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        // Log consumer failure without aborting event delivery to other subscribers
        console.error(`[CommitEventPublisher] Consumer error for commit ${event.hash}:`, error);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Removes all registered consumers from the publisher.
   */
  clear(): void {
    this.consumers.clear();
  }

  /**
   * Returns the current number of subscribed consumers.
   */
  get consumerCount(): number {
    return this.consumers.size;
  }
}
