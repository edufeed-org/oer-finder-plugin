import type { components } from '@edufeed-org/oer-finder-api-client';
import type {
  FetchPageFn,
  MultiSourceConfig,
  MultiSourcePaginationState,
  PaginationMeta,
} from '../pagination/types.js';
import { paginationMetaToOerMeta } from '../pagination/types.js';
import { createMultiSourceState, loadNextPage } from '../pagination/multi-source-paginator.js';
import { ALL_SOURCES_TIMEOUT_MS, DEFAULT_PAGE_SIZE } from '../constants.js';

type OerItem = components['schemas']['OerItemSchema'];
type OerMetadata = components['schemas']['OerMetadataSchema'];

export interface PaginationControllerOptions {
  readonly sourceIds: readonly string[];
  readonly fetchPage: FetchPageFn;
  readonly pageSize?: number;
  readonly timeoutMs?: number;
}

export interface PaginationLoadResult {
  readonly items: readonly OerItem[];
  readonly meta: PaginationMeta;
  /** Legacy-compatible OerMetadata for LoadMore component */
  readonly oerMeta: OerMetadata;
}

/**
 * A thin stateful wrapper that bridges the pure pagination functions to the UI.
 * Manages MultiSourcePaginationState lifecycle for OerSearch.
 */
export class PaginationController {
  private config: MultiSourceConfig | null = null;
  private state: MultiSourcePaginationState | null = null;
  private pageSize: number = DEFAULT_PAGE_SIZE;

  /** Configure for a new search session. Resets all state. */
  configure(options: PaginationControllerOptions): void {
    this.pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    this.config = {
      sourceIds: options.sourceIds,
      fetchPage: options.fetchPage,
      pageSize: this.pageSize,
      timeoutMs: options.timeoutMs ?? ALL_SOURCES_TIMEOUT_MS,
    };
    this.state = createMultiSourceState(options.sourceIds);
  }

  /** Load the first page. Resets pagination state. */
  async loadFirst(): Promise<PaginationLoadResult> {
    if (!this.config) {
      throw new Error('PaginationController not configured. Call configure() first.');
    }
    this.state = createMultiSourceState(this.config.sourceIds);
    return this.loadInternal();
  }

  /** Load the next page (Load More). Continues from current state. */
  async loadNext(): Promise<PaginationLoadResult> {
    if (!this.config || !this.state) {
      throw new Error('PaginationController not configured. Call configure() first.');
    }
    return this.loadInternal();
  }

  /** Reset pagination state without reconfiguring. */
  reset(): void {
    if (this.config) {
      this.state = createMultiSourceState(this.config.sourceIds);
    }
  }

  /** Whether more results can be loaded. */
  get hasMore(): boolean {
    if (!this.state) return false;
    return Array.from(this.state.sources.values()).some(
      (s) => s.active && (s.buffer.length > 0 || s.hasMorePages),
    );
  }

  private async loadInternal(): Promise<PaginationLoadResult> {
    const result = await loadNextPage(this.config!, this.state!);
    this.state = result.nextState;
    return {
      items: result.items,
      meta: result.meta,
      oerMeta: paginationMetaToOerMeta(result.meta, this.pageSize),
    };
  }
}
