# TripCraft AI - AI Travel Itinerary Planner

A full-stack travel planning application that uses a multi-step **LangGraph AI agent** to research destinations, plan day-by-day itineraries, validate logistics, and optimize routes — all streamed in real-time via WebSocket.

## Tech Stack

**Backend:** FastAPI, LangGraph, LangChain, Motor (async MongoDB), WebSocket
**Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, React Query, React-Leaflet
**Database:** MongoDB
**LLM:** Groq (Llama 3.3 70B with automatic fallback to 8B)
**APIs:** Open-Meteo (weather), Nominatim (geocoding), Frankfurter (currency)

## Architecture

### LangGraph Agent Pipeline

The AI agent runs a 5-node stateful graph:

```
research_destination → fetch_external_data → plan_itinerary → validate_itinerary → optimize_route
                                                    ↑                    |
                                                    |←── (if issues) ←──|
```

1. **Research** — LLM identifies top attractions based on destination and interests
2. **Fetch Data** — Parallel API calls for weather forecast, geocoding, and currency exchange
3. **Plan** — LLM creates day-by-day itinerary with activities, timing, costs, and coordinates
4. **Validate** — LLM checks for schedule conflicts, budget overruns, and logistics issues
5. **Optimize** — LLM reorders activities within each day to minimize travel time

### Real-Time Streaming

- WebSocket connection streams node-by-node progress to the frontend
- Each phase transition updates the UI in real-time
- Itinerary data appears incrementally as the agent works

### Data Flow

```
Frontend (React) ←→ WebSocket ←→ FastAPI ←→ LangGraph Agent ←→ Groq LLM
                         ↕                         ↕
                    REST APIs              External APIs (Weather, Geo)
                         ↕
                      MongoDB
```

## Features

- Multi-step AI agent with conditional routing and validation loops
- Real-time WebSocket streaming of agent progress
- Interactive map with color-coded day markers and route polylines
- Day-by-day timeline view with activity cards
- Chat interface to modify itineraries conversationally
- Automatic rate limit fallback (70B → 8B model)
- Trip CRUD with MongoDB persistence
- Weather, currency, and geocoding integration

## Project Structure

```
project/
├── backend/
│   ├── app/
│   │   ├── agent/           # LangGraph agent
│   │   │   ├── graph.py     # StateGraph definition
│   │   │   ├── nodes.py     # Agent node functions
│   │   │   ├── state.py     # TypedDict state schema
│   │   │   ├── tools.py     # LangChain tools (geocode, weather, currency)
│   │   │   ├── prompts.py   # Prompt templates
│   │   │   └── llm.py       # LLM with auto-fallback
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── services/        # Business logic (agent, trip, itinerary)
│   │   ├── models/          # Pydantic models
│   │   ├── utils/           # Helpers (geo, date)
│   │   ├── config.py        # Settings
│   │   ├── database.py      # Motor MongoDB client
│   │   └── main.py          # FastAPI app
│   ├── .env                 # Environment variables
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── chat/        # ChatPanel, PhaseProgress
│   │   │   ├── itinerary/   # ItineraryView, DayTimeline, ActivityCard
│   │   │   ├── map/         # TripMap (React-Leaflet)
│   │   │   ├── trip/        # TripForm, TripCard, InterestPicker
│   │   │   └── layout/      # MainLayout, Navbar
│   │   ├── hooks/           # useAgentStream, useTrips
│   │   ├── store/           # Zustand stores (chat, UI)
│   │   ├── api/             # WebSocket manager, REST client
│   │   ├── types/           # TypeScript interfaces
│   │   ├── pages/           # HomePage, PlannerPage, TripsListPage
│   │   └── utils/           # Constants, formatters
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 7+
- Groq API key ([free at console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
GROQ_API_KEY=your_groq_api_key_here
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=travel_planner
EOF

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### MongoDB

```bash
# Start MongoDB (adjust path to your installation)
mongod --dbpath ~/mongodb/data --fork --logpath ~/mongodb/log/mongod.log
```

Open http://localhost:5173 to use the app.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips` | List all trips |
| GET | `/api/trips/:id` | Get trip by ID |
| PUT | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| GET | `/api/itineraries/:tripId` | Get itinerary |
| WS | `/ws/trips/:id/chat` | WebSocket for agent streaming |

## Key Concepts Demonstrated

- **LangGraph**: Multi-node agentic workflow with conditional edges and state management
- **FastAPI**: Async REST + WebSocket APIs with dependency injection
- **MongoDB + Motor**: Async document database operations
- **React + TypeScript**: Type-safe component architecture
- **Zustand**: Lightweight state management with selectors
- **WebSocket Streaming**: Real-time bidirectional communication
- **LangChain Tools**: Custom async tools for external API integration
