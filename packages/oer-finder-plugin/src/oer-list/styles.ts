import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .list-container {
    width: 100%;
    margin-bottom: 24px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 18px;
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-primary);
  }

  .empty-message {
    font-size: 14px;
    margin: 0;
    color: var(--text-secondary);
  }

  .loading {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-secondary);
  }

  .loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid var(--spinner-track-color, #f3f3f3);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error {
    text-align: center;
    padding: 48px 24px;
    color: var(--error-color, #d32f2f);
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-message {
    font-size: 14px;
    margin: 0;
  }
`;
