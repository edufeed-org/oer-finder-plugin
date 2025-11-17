import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    width: 100%;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--background-form);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pagination-info {
    font-size: 14px;
    color: var(--text-secondary);
    flex: 1 1 100%;
    text-align: center;
    margin-bottom: 8px;
  }

  .pagination-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    flex: 1 1 100%;
  }

  .page-button {
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
    min-width: 40px;
    flex-shrink: 0;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .page-button:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.1);
  }

  .page-button:disabled {
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.3);
    cursor: not-allowed;
  }

  .page-info {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 8px;
    white-space: nowrap;
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .pagination {
      padding: 12px;
      flex-direction: column;
    }

    .pagination-info {
      margin-bottom: 12px;
      font-size: 13px;
    }

    .pagination-controls {
      gap: 6px;
      width: 100%;
    }

    .page-button {
      padding: 8px 10px;
      font-size: 13px;
      min-width: 60px;
      flex: 1 1 auto;
    }

    .page-info {
      flex-basis: 100%;
      text-align: center;
      margin: 8px 0;
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: 10px;
    }

    .pagination-info {
      font-size: 12px;
    }

    .pagination-controls {
      gap: 4px;
    }

    .page-button {
      padding: 6px 8px;
      font-size: 12px;
      min-width: 50px;
    }

    .page-info {
      font-size: 12px;
      margin: 6px 0;
    }
  }
`;
