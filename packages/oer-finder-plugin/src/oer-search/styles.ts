import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .search-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .slot-container {
    margin-top: 24px;
  }

  .slot-container:empty {
    display: none;
    margin-top: 0;
  }

  .search-container {
    background: var(--background-form);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .search-header {
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .search-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  input,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
    background: white;
    color: var(--text-primary);
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .button-group {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .search-button {
    background: var(--primary-color);
    color: white;
    flex: 1;
  }

  .search-button:hover:not(:disabled) {
    background: var(--primary-hover-color);
  }

  .search-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .clear-button {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-secondary);
    flex: 0 0 auto;
  }

  .clear-button:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--background-form);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin-top: 24px;
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
    .search-container {
      padding: 16px;
    }

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

    .button-group {
      flex-direction: column;
    }

    .search-button,
    .clear-button {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .search-container {
      padding: 12px;
    }

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

    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .error-message {
    background: #ffebee;
    color: #c62828;
    padding: 12px 16px;
    border-radius: 6px;
    margin-top: 12px;
    font-size: 14px;
  }

  .toggle-filters-button {
    background: transparent;
    color: var(--primary-color);
    padding: 8px 0;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }

  .toggle-filters-button::before {
    content: '▶';
    display: inline-block;
    transition: transform 0.2s ease;
    font-size: 10px;
  }

  .toggle-filters-button:hover {
    color: var(--primary-hover-color);
  }

  .advanced-filters {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .advanced-filters.expanded {
    max-height: 1000px;
  }

  .advanced-filters.expanded ~ .toggle-filters-button::before,
  .toggle-filters-button:has(~ .advanced-filters.expanded)::before {
    transform: rotate(90deg);
  }

  /* Fix the button state when filters are expanded */
  form:has(.advanced-filters.expanded) .toggle-filters-button::before {
    transform: rotate(90deg);
  }
`;
