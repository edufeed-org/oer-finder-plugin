import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .card {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
    background: var(--background-card);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition:
      box-shadow 0.3s ease,
      transform 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .thumbnail-container {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f5f5f5;
    position: relative;
    cursor: pointer;
  }

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }

  .thumbnail-container:hover .thumbnail {
    transform: scale(1.05);
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
    font-size: 48px;
  }

  .content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-primary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .description {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex: 1;
  }

  .metadata {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
  }

  .license {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .license a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
  }

  .license a:hover {
    text-decoration: underline;
  }

  .keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .keyword {
    background: rgba(0, 0, 0, 0.05);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--text-secondary);
  }

  .attribution {
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.4;
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

  .no-data {
    color: var(--text-muted);
    font-style: italic;
    font-size: 12px;
  }
`;
