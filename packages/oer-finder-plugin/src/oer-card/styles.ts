import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
    --primary-color: #667eea;
    --secondary-color: #764ba2;
  }

  .card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    transition: box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    color: #333;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .description {
    font-size: 14px;
    color: #666;
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
    color: #666;
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
    background: #f0f0f0;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: #555;
  }

  .no-data {
    color: #999;
    font-style: italic;
    font-size: 12px;
  }
`;
