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
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
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
    border: 1px solid var(--input-border-color, rgba(0, 0, 0, 0.15));
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
    background: var(--background-input, white);
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
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-secondary);
    flex: 0 0 auto;
  }

  .clear-button:hover {
    background: var(--button-secondary-hover-bg, rgba(0, 0, 0, 0.1));
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .search-container {
      padding: 16px;
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

  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    cursor: pointer;
    color: var(--text-primary);
  }

  .checkbox-label input[type='checkbox'] {
    width: auto;
    margin: 0;
    cursor: pointer;
    accent-color: var(--primary-color);
  }
`;
