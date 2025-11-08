# AI Swarm Arena

A hackathon project that simulates an intelligent digital workforce of AI agents collaborating in real-time to design and architect your software project.

## Features

- **Multi-Agent Collaboration**: PM, Dev, UX, and QA agents work together
- **Real-Time Visualization**: D3.js force-directed graph showing agent interactions
- **Live Debate**: Watch agents discuss and refine project ideas
- **Architecture Generation**: Get a complete project plan and downloadable scaffold
- **WebSocket Communication**: Real-time updates via WebSocket

## Project Structure

\`\`\`
/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard with swarm visualization
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and helpers
│   ├── types.ts          # TypeScript type definitions
│   ├── constants.ts      # App constants
│   ├── api.ts            # API client
│   └── websocket.ts      # WebSocket client
├── store/                # Zustand state management
│   └── swarm-store.ts    # Global swarm state
└── backend/              # FastAPI backend
    ├── main.py           # FastAPI app
    ├── agents/           # Agent modules
    └── requirements.txt  # Python dependencies
\`\`\`

## Getting Started

### Frontend (Next.js)

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create `.env.local`:
   \`\`\`env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000)

### Backend (FastAPI)

1. Navigate to backend directory:
   \`\`\`bash
   cd backend
   \`\`\`

2. Install Python dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Run the FastAPI server:
   \`\`\`bash
   uvicorn main:app --reload
   \`\`\`

4. API available at [http://localhost:8000](http://localhost:8000)

## Tech Stack

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **D3.js** - Force graph visualization
- **Zustand** - State management
- **socket.io-client** - WebSocket client
- **shadcn/ui** - UI components

### Backend
- **FastAPI** - Python web framework
- **WebSockets** - Real-time communication
- **Python 3.11+** - Backend runtime

## How It Works

1. **Enter Project Idea**: Describe your project on the landing page
2. **Generate Team**: Click "Generate Team" to spawn AI agents
3. **Start Debate**: Watch agents collaborate in real-time
4. **View Architecture**: See the generated project plan
5. **Download Artifact**: Get a ZIP file with project scaffold

## Future Enhancements

- LangGraph integration for true AI-powered agents
- Supabase for persistent storage
- ElevenLabs for voice synthesis
- Advanced project scaffolding
- Authentication and user projects

## Built For

UBHacking Hackathon - Demonstrating AI Swarm Intelligence

## License

MIT
