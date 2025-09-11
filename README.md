# Flashcard Frenzy

A real-time multiplayer flashcard quiz game built with Next.js, featuring live challenges, competitive scoring, and comprehensive match history tracking.

## Features

### Core Gameplay
- **Real-time Multiplayer**: Challenge other players in live flashcard battles
- **Dynamic Scoring**: Points based on question difficulty and response time
- **Live Match Updates**: Real-time score updates and game progress
- **Question Variety**: Multiple question categories with varying difficulty levels
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### User Experience
- **Authentication**: Secure user authentication with Supabase
- **User Profiles**: Track your performance and match history
- **Online Status**: See which players are available for challenges
- **Match History**: Comprehensive tracking of all your games
- **Accessibility**: Screen reader support and keyboard navigation

### Technical Features
- **WebSocket Integration**: Real-time communication for live gameplay
- **Database Integration**: MongoDB for persistent data storage
- **API Routes**: RESTful endpoints for game management
- **TypeScript**: Full type safety throughout the application
- **Modern UI**: Built with Tailwind CSS for responsive design

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Deployment**: Custom Node.js server

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flashcard-frenzy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

### Database Setup

The application uses MongoDB with the following collections:
- **users**: User profiles and online status
- **matches**: Active and completed game matches
- **matchhistories**: Detailed match results and statistics

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication page
│   ├── game/              # Game interface
│   ├── history/           # Match history page
│   └── lobby/             # Player lobby
├── components/            # Reusable UI components
├── features/              # Feature-specific components
│   ├── auth/              # Authentication forms
│   ├── game/              # Game logic and UI
│   └── lobby/             # Lobby and player management
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── models/                # Database schemas
├── types/                 # TypeScript type definitions
└── data/                  # Static data and questions
```

## API Endpoints

### Authentication
- `POST /api/users/sync` - Sync user data with database
- `POST /api/users/logout` - Update user offline status

### Game Management
- `POST /api/match` - Create a new match
- `DELETE /api/match/[id]` - Delete a match
- `GET /api/players` - Get online players
- `GET /api/match-history` - Get user's match history

### WebSocket Events
- `challenge-player` - Send challenge to another player
- `challenge-received` - Receive challenge notification
- `challenge-response` - Accept or decline challenge
- `player-answered` - Broadcast player's answer
- `match-update` - Real-time score updates

## Game Flow

1. **Authentication**: Users sign in through Supabase
2. **Lobby**: View online players and send challenges
3. **Challenge**: Real-time challenge notifications
4. **Game**: Live multiplayer flashcard quiz
5. **Results**: Score tracking and match history

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Custom Server

The application uses a custom Node.js server (`server.js`) to integrate Socket.IO with Next.js for real-time functionality.

## Deployment

### Environment Variables

Ensure the following environment variables are set in production:

- `MONGODB_URI` - MongoDB connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NODE_ENV` - Set to "production"

### Build and Deploy

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```