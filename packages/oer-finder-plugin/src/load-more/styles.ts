import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    width: 100%;
  }

  .load-more-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    gap: 12px;
  }

  .load-more-info {
    font-size: 14px;
    color: var(--text-secondary);
    text-align: center;
  }

  .load-more-button {
    padding: 10px 24px;
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-primary);
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    min-width: 120px;
  }

  .load-more-button:hover:not(:disabled) {
    background: var(--button-secondary-hover-bg, rgba(0, 0, 0, 0.1));
  }

  .load-more-button:disabled {
    color: var(--text-disabled, rgba(0, 0, 0, 0.3));
    cursor: not-allowed;
  }

  .all-loaded {
    font-size: 14px;
    color: var(--text-secondary);
    text-align: center;
    padding: 8px 0;
  }

  @media (max-width: 480px) {
    .load-more-container {
      padding: 12px;
    }

    .load-more-info {
      font-size: 12px;
    }

    .load-more-button {
      font-size: 13px;
      padding: 8px 20px;
    }
  }
`;
