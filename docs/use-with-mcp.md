# OER Finder API mit MCP (Model Context Protocol) nutzen

Dieses Dokument beschreibt, wie man einen **MCP-Server** erstellt, der die OER Finder API nutzt, um KI-Modellen (wie Claude, GPT, etc.) den Zugriff auf offene Bildungsressourcen (OER) zu ermöglichen.

## Überblick

### Was ist MCP?

Das [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) ist ein offener Standard, der es KI-Modellen ermöglicht, mit externen Datenquellen und Tools zu interagieren. Ein MCP-Server stellt "Tools" bereit, die ein KI-Modell aufrufen kann.

### Anwendungsfall: Unterrichtsvorbereitung

Ein Lehrer kann mit einem KI-Assistenten sprechen:

> "Ich brauche Materialien zum Thema Reformation für die 8. Klasse Gymnasium"

Der KI-Assistent nutzt den MCP-Server, um:
1. Nach passenden OER-Materialien zu suchen
2. Die Ergebnisse nach Bildungsstufe zu filtern
3. Lizenzinformationen bereitzustellen
4. Direkte Links zu den Ressourcen anzubieten

### Warum ein separates Projekt?

- **Separation of Concerns**: Der OER Finder ist eine REST-API, der MCP-Server ist ein Adapter
- **Unabhängige Versionierung**: MCP-Server kann schneller iterieren
- **Flexibilität**: Verschiedene MCP-Server für verschiedene Anwendungsfälle
- **Einfachere Wartung**: Klare Verantwortlichkeiten

## Architektur

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   KI-Modell     │────▶│   MCP-Server    │────▶│  OER Finder API │
│ (Claude, GPT)   │◀────│ (oer-mcp-server)│◀────│  (REST API)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      │
         ▼                      ▼
   Nutzerinterface         Tools:
   (VS Code, CLI,          - search_oer
    Desktop App)           - get_oer_details
                           - list_sources
```

## Projekt-Setup

### 1. Neues Projekt erstellen

```bash
mkdir oer-mcp-server
cd oer-mcp-server
pnpm init
```

### 2. Abhängigkeiten installieren

```bash
pnpm add @modelcontextprotocol/sdk zod
pnpm add -D typescript @types/node
```

### 3. TypeScript konfigurieren

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

### 4. Package.json konfigurieren

```json
{
  "name": "oer-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "oer-mcp-server": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  }
}
```

## MCP-Server Implementierung

### Hauptdatei (src/index.ts)

```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Konfiguration
const OER_API_BASE_URL = process.env.OER_API_URL || 'https://api.oer-finder.example.com';

// API-Client
async function searchOer(params: {
  searchTerm: string;
  source?: string;
  pageSize?: number;
  page?: number;
}) {
  const url = new URL(`${OER_API_BASE_URL}/api/v1/oer`);
  url.searchParams.set('searchTerm', params.searchTerm);
  if (params.source) url.searchParams.set('source', params.source);
  if (params.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params.page) url.searchParams.set('page', params.page.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

async function getSources() {
  const response = await fetch(`${OER_API_BASE_URL}/api/v1/sources`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// MCP Server erstellen
const server = new Server(
  {
    name: 'oer-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tools definieren
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_oer',
        description: `Sucht nach offenen Bildungsressourcen (OER) im AMB-Format.
        
Nutze dieses Tool, wenn der Nutzer nach Unterrichtsmaterialien, 
Lernressourcen oder Bildungsinhalten sucht. Die Ergebnisse enthalten:
- Titel und Beschreibung
- Lizenzinformationen (CC-Lizenzen)
- Bildungsstufe und Medientyp
- Direkte Links zur Ressource

Beispiel-Suchanfragen:
- "Reformation Martin Luther"
- "Ostern Grundschule"
- "Ethik Oberstufe"`,
        inputSchema: {
          type: 'object',
          properties: {
            searchTerm: {
              type: 'string',
              description: 'Suchbegriff(e) für die Materialsuche',
            },
            source: {
              type: 'string',
              description: 'Optionale Quellenfilterung (z.B. "rpi-virtuell", "wirlernenonline")',
            },
            pageSize: {
              type: 'number',
              description: 'Anzahl der Ergebnisse (Standard: 10, Max: 50)',
              default: 10,
            },
            educationalLevel: {
              type: 'string',
              description: 'Bildungsstufe (z.B. "Grundschule", "Sekundarstufe", "Oberstufe")',
            },
          },
          required: ['searchTerm'],
        },
      },
      {
        name: 'list_oer_sources',
        description: `Listet alle verfügbaren OER-Quellen auf.
        
Nutze dieses Tool, um dem Nutzer zu zeigen, welche Materialquellen
durchsucht werden können. Hilfreich wenn der Nutzer fragt:
- "Welche Quellen gibt es?"
- "Woher kommen die Materialien?"`,
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Tool-Aufrufe verarbeiten
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_oer': {
        const params = args as {
          searchTerm: string;
          source?: string;
          pageSize?: number;
          educationalLevel?: string;
        };

        const results = await searchOer({
          searchTerm: params.searchTerm,
          source: params.source,
          pageSize: Math.min(params.pageSize || 10, 50),
        });

        // Ergebnisse für das Modell formatieren
        const formattedResults = results.data.map((item: any) => ({
          title: item.amb.name,
          description: item.amb.description,
          url: item.amb.id,
          license: item.amb.license?.id || 'Unbekannt',
          creator: item.amb.creator?.[0]?.name || item.amb.publisher?.name || 'Unbekannt',
          educationalLevel: item.amb.educationalLevel?.map((l: any) => l.name).join(', ') || 'Alle',
          resourceType: item.amb.learningResourceType?.map((t: any) => t.name).join(', ') || 'Unbekannt',
          keywords: item.amb.keywords?.join(', ') || '',
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total: results.meta.total,
                page: results.meta.page,
                results: formattedResults,
              }, null, 2),
            },
          ],
        };
      }

      case 'list_oer_sources': {
        const sources = await getSources();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sources, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        },
      ],
      isError: true,
    };
  }
});

// Server starten
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OER MCP Server gestartet');
}

main().catch(console.error);
```

## MCP-Client Konfiguration

### Claude Desktop

In `claude_desktop_config.json` (Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "oer-finder": {
      "command": "node",
      "args": ["C:/path/to/oer-mcp-server/dist/index.js"],
      "env": {
        "OER_API_URL": "https://api.oer-finder.example.com"
      }
    }
  }
}
```

### VS Code mit Copilot

In `.vscode/mcp.json`:

```json
{
  "servers": {
    "oer-finder": {
      "command": "node",
      "args": ["${workspaceFolder}/../oer-mcp-server/dist/index.js"],
      "env": {
        "OER_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

### Cursor

In den Cursor-Einstellungen unter "MCP Servers":

```json
{
  "oer-finder": {
    "command": "npx",
    "args": ["-y", "oer-mcp-server"],
    "env": {
      "OER_API_URL": "https://api.oer-finder.example.com"
    }
  }
}
```

## Erweiterte Features

### Caching

Für bessere Performance kann ein Cache hinzugefügt werden:

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 Minuten
});

async function searchOerCached(params: SearchParams) {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await searchOer(params);
  cache.set(cacheKey, result);
  return result;
}
```

### Prompts für Unterrichtsvorbereitung

MCP unterstützt auch vordefinierte Prompts:

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'lesson_preparation',
        description: 'Hilft bei der Unterrichtsvorbereitung mit OER-Materialien',
        arguments: [
          {
            name: 'topic',
            description: 'Unterrichtsthema',
            required: true,
          },
          {
            name: 'grade',
            description: 'Klassenstufe',
            required: true,
          },
          {
            name: 'subject',
            description: 'Unterrichtsfach',
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === 'lesson_preparation') {
    const { topic, grade, subject } = request.params.arguments || {};
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Ich bereite eine Unterrichtsstunde vor:
- Thema: ${topic}
- Klassenstufe: ${grade}
${subject ? `- Fach: ${subject}` : ''}

Bitte suche passende OER-Materialien und erstelle einen Vorschlag 
für den Unterrichtsaufbau mit konkreten Materialempfehlungen.`,
          },
        },
      ],
    };
  }
  throw new Error('Prompt not found');
});
```

### Ressourcen-Zugriff

MCP kann auch direkte Ressourcen bereitstellen:

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'oer://sources',
        name: 'Verfügbare OER-Quellen',
        description: 'Liste aller durchsuchbaren OER-Repositorien',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'oer://sources') {
    const sources = await getSources();
    return {
      contents: [
        {
          uri: 'oer://sources',
          mimeType: 'application/json',
          text: JSON.stringify(sources, null, 2),
        },
      ],
    };
  }
  throw new Error('Resource not found');
});
```

## Deployment

### Als npm-Paket veröffentlichen

```bash
pnpm build
npm publish
```

Nutzer können dann einfach per `npx oer-mcp-server` starten.

### Als Docker-Container

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## Integration in eigene Chatbots (OpenAI API)

Wenn du einen eigenen Chatbot baust, der über die OpenAI API (oder kompatible Endpoints wie Azure OpenAI, Ollama, LM Studio) auf ein LLM zugreift, gibt es zwei Ansätze:

### Ansatz 1: MCP-Client im Chatbot

Der Chatbot fungiert als MCP-Client und kommuniziert mit dem MCP-Server:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OpenAI API    │◀───▶│    Chatbot      │◀───▶│   MCP-Server    │
│   (LLM)         │     │  (MCP-Client)   │     │ (oer-mcp-server)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  OER Finder API │
                        └─────────────────┘
```

**Implementierung mit @modelcontextprotocol/sdk:**

```typescript
// chatbot-with-mcp.ts
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

// OpenAI Client (funktioniert auch mit kompatiblen APIs)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Für andere Endpoints:
  // baseURL: 'http://localhost:11434/v1', // Ollama
  // baseURL: 'https://your-resource.openai.azure.com', // Azure
});

// MCP Client erstellen und mit Server verbinden
async function createMcpClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./oer-mcp-server/dist/index.js'],
    env: {
      ...process.env,
      OER_API_URL: 'http://localhost:3001',
    },
  });

  const client = new Client({
    name: 'chatbot-client',
    version: '1.0.0',
  });

  await client.connect(transport);
  return client;
}

// MCP-Tools in OpenAI-Format konvertieren
async function getOpenAITools(mcpClient: Client) {
  const { tools } = await mcpClient.listTools();
  
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

// Chatbot-Hauptlogik
async function chat(userMessage: string, mcpClient: Client) {
  const tools = await getOpenAITools(mcpClient);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `Du bist ein hilfreicher Assistent für Lehrkräfte. 
Du kannst nach offenen Bildungsressourcen (OER) suchen und diese empfehlen.
Nutze die verfügbaren Tools, um passende Materialien zu finden.
Antworte immer auf Deutsch.`,
    },
    { role: 'user', content: userMessage },
  ];

  // Erste Anfrage an das LLM
  let response = await openai.chat.completions.create({
    model: 'gpt-5-mini', 
    messages,
    tools,
    tool_choice: 'auto',
  });

  let assistantMessage = response.choices[0].message;

  // Tool-Calls verarbeiten (Loop für mehrere aufeinanderfolgende Calls)
  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    messages.push(assistantMessage);

    // Alle Tool-Calls ausführen
    for (const toolCall of assistantMessage.tool_calls) {
      console.log(`Calling tool: ${toolCall.function.name}`);
      
      // MCP-Tool aufrufen
      const result = await mcpClient.callTool({
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
      });

      // Tool-Ergebnis zur Konversation hinzufügen
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result.content[0].type === 'text' 
          ? result.content[0].text 
          : JSON.stringify(result.content),
      });
    }

    // Nächste Antwort vom LLM holen
    response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      tools,
      tool_choice: 'auto',
    });

    assistantMessage = response.choices[0].message;
  }

  return assistantMessage.content;
}

// Beispiel-Nutzung
async function main() {
  const mcpClient = await createMcpClient();
  
  try {
    const answer = await chat(
      'Ich suche Materialien zum Thema Ostern für die Grundschule',
      mcpClient
    );
    console.log('Assistent:', answer);
  } finally {
    await mcpClient.close();
  }
}

main();
```

### Ansatz 2: Direkter API-Zugriff (ohne MCP)

Wenn du keinen MCP-Server verwenden möchtest, kannst du die OER Finder API auch direkt als OpenAI-Tool definieren:

```typescript
// chatbot-direct.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OER_API_URL = process.env.OER_API_URL || 'http://localhost:3001';

// Tools direkt definieren
const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_oer',
      description: `Sucht nach offenen Bildungsressourcen (OER).
Nutze dieses Tool für Unterrichtsmaterialien, Lernressourcen etc.`,
      parameters: {
        type: 'object',
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Suchbegriff(e)',
          },
          source: {
            type: 'string',
            description: 'Quelle (z.B. "rpi-virtuell")',
          },
          pageSize: {
            type: 'number',
            description: 'Anzahl Ergebnisse (max 50)',
            default: 10,
          },
        },
        required: ['searchTerm'],
      },
    },
  },
];

// Tool-Implementierung
async function executeTool(name: string, args: Record<string, unknown>) {
  if (name === 'search_oer') {
    const params = new URLSearchParams();
    params.set('searchTerm', args.searchTerm as string);
    if (args.source) params.set('source', args.source as string);
    if (args.pageSize) params.set('pageSize', String(args.pageSize));

    const response = await fetch(`${OER_API_URL}/api/v1/oer?${params}`);
    const data = await response.json();

    // Ergebnisse für das LLM formatieren
    return JSON.stringify({
      total: data.meta.total,
      results: data.data.map((item: any) => ({
        title: item.amb.name,
        description: item.amb.description,
        url: item.amb.id,
        license: item.amb.license?.id,
        creator: item.amb.creator?.[0]?.name || item.amb.publisher?.name,
      })),
    });
  }
  throw new Error(`Unknown tool: ${name}`);
}

// Chat-Funktion
async function chat(userMessage: string) {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'Du bist ein Assistent für Lehrkräfte. Suche nach passenden OER-Materialien.',
    },
    { role: 'user', content: userMessage },
  ];

  let response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages,
    tools,
    tool_choice: 'auto',
  });

  let message = response.choices[0].message;

  while (message.tool_calls?.length) {
    messages.push(message);

    for (const toolCall of message.tool_calls) {
      const result = await executeTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments)
      );
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      tools,
    });
    message = response.choices[0].message;
  }

  return message.content;
}
```

### Ansatz 3: Express-Server mit Streaming

Für eine Web-Anwendung mit Streaming-Unterstützung:

```typescript
// server.ts
import express from 'express';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const app = express();
app.use(express.json());

const openai = new OpenAI();
let mcpClient: Client;

// MCP-Client beim Start initialisieren
async function initMcpClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./oer-mcp-server/dist/index.js'],
  });
  mcpClient = new Client({ name: 'web-chatbot', version: '1.0.0' });
  await mcpClient.connect(transport);
}

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  // SSE für Streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const tools = await getOpenAITools(mcpClient);
  const messages = [
    { role: 'system', content: 'Du bist ein OER-Assistent für Lehrkräfte.' },
    ...history,
    { role: 'user', content: message },
  ];

  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    tools,
    stream: true,
  });

  let toolCalls: any[] = [];
  let currentToolCall: any = null;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    // Text-Content streamen
    if (delta?.content) {
      res.write(`data: ${JSON.stringify({ type: 'text', content: delta.content })}\n\n`);
    }

    // Tool-Calls sammeln
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        if (tc.index !== undefined) {
          if (!toolCalls[tc.index]) {
            toolCalls[tc.index] = { id: '', function: { name: '', arguments: '' } };
          }
          if (tc.id) toolCalls[tc.index].id = tc.id;
          if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name;
          if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
        }
      }
    }
  }

  // Tool-Calls ausführen wenn vorhanden
  if (toolCalls.length > 0) {
    res.write(`data: ${JSON.stringify({ type: 'tool_start' })}\n\n`);

    for (const toolCall of toolCalls) {
      const result = await mcpClient.callTool({
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
      });

      // Weitere Verarbeitung mit Tool-Ergebnissen...
      res.write(`data: ${JSON.stringify({ 
        type: 'tool_result', 
        tool: toolCall.function.name,
        result: result.content 
      })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();
});

initMcpClient().then(() => {
  app.listen(3000, () => console.log('Chatbot server running on port 3000'));
});
```

### Frontend-Integration (React)

```tsx
// ChatComponent.tsx
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              assistantMessage += data.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (newMessages[lastIdx]?.role === 'assistant') {
                  newMessages[lastIdx].content = assistantMessage;
                } else {
                  newMessages.push({ role: 'assistant', content: assistantMessage });
                }
                return newMessages;
              });
            }
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, messages]);

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Frage nach Unterrichtsmaterialien..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          Senden
        </button>
      </div>
    </div>
  );
}
```

### Kompatible LLM-Endpoints

Der Code funktioniert mit allen OpenAI-kompatiblen APIs:

| Provider | Base URL | Modell |
|----------|----------|--------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4-turbo-preview` |
| Azure OpenAI | `https://{resource}.openai.azure.com` | `gpt-4` |
| Ollama | `http://localhost:11434/v1` | `llama3`, `mistral` |
| LM Studio | `http://localhost:1234/v1` | Lokales Modell |
| Together AI | `https://api.together.xyz/v1` | `mistralai/Mixtral-8x7B` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` |

**Hinweis**: Nicht alle Modelle unterstützen Tool-Calling gleich gut. GPT-4 und Claude haben die beste Tool-Calling-Unterstützung.

## Beispiel-Interaktionen

### Einfache Suche

**Nutzer**: "Ich suche Materialien zum Thema Ostern für die Grundschule"

**KI ruft auf**: `search_oer({ searchTerm: "Ostern Grundschule", pageSize: 10 })`

**KI antwortet**: "Ich habe 15 passende Materialien gefunden. Hier sind die relevantesten:

1. **Fastenzeit und Ostern Download-Materialien** - Ausmalbilder und Bastelvorlagen (CC BY-NC-ND 4.0)
2. **Ostern einmal anders** - Skurrile Osterbräuche als Unterrichtsidee (Klett-Verlag)
..."

### Gezielte Quellensuche

**Nutzer**: "Zeig mir nur Materialien von RPI-Virtuell zum Thema Reformation"

**KI ruft auf**: `search_oer({ searchTerm: "Reformation", source: "rpi-virtuell" })`

## Weiterführende Links

- [Model Context Protocol Spezifikation](https://spec.modelcontextprotocol.io/)
- [MCP SDK für TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [OER Finder API Dokumentation](./client-packages.md)
- [AMB Metadatenstandard](https://dini-ag-kim.github.io/amb/)

## Lizenz

Dieses Dokument und der Beispielcode stehen unter CC0 1.0 Universal (CC0 1.0) Lizenz bereit.
