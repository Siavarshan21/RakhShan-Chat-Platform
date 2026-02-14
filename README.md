# Rakhshan Chat

A production-ready, end-to-end encrypted mobile messaging application built with React Native and NestJS.

## Architecture

```
rakhshan-chat/
├── apps/
│   ├── mobile/          # React Native (Expo) mobile app
│   └── backend/         # NestJS backend API
├── packages/
│   └── shared/          # Shared types, constants, validation
├── infra/
│   ├── docker/          # Docker compose & Dockerfiles
│   ├── nginx/           # Reverse proxy configuration
│   └── ci-cd/           # GitHub Actions workflows
├── scripts/             # Utility scripts
└── docs/                # Documentation
```

## Tech Stack

### Mobile
- **Framework:** React Native with Expo
- **Language:** TypeScript (strict mode)
- **Navigation:** React Navigation v7
- **State Management:** Zustand
- **Animations:** React Native Reanimated
- **Real-time:** Socket.IO Client
- **Encryption:** TweetNaCl.js (NaCl/libsodium)
- **Storage:** Expo SecureStore + AsyncStorage

### Backend
- **Framework:** NestJS
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Real-time:** Socket.IO (WebSocket)
- **Auth:** JWT with refresh tokens
- **Encryption:** TweetNaCl + Node.js crypto
- **Storage:** S3-compatible (MinIO for dev)
- **API Docs:** Swagger/OpenAPI

### Infrastructure
- Docker Compose for local development
- Nginx reverse proxy with SSL, rate limiting, WebSocket support
- GitHub Actions CI/CD pipeline

## Features

- Phone number authentication with OTP verification
- End-to-end encrypted messaging (NaCl box encryption)
- Real-time messaging via WebSockets
- Optimistic UI updates for instant message delivery
- Offline message queue with background sync
- Private and group chats
- Message reactions, replies, editing, and deletion
- Typing indicators and read receipts
- Voice and video call signaling (WebRTC)
- Push notifications (FCM + APNs)
- User presence (online/offline/away)
- Media sharing with encrypted file storage
- Profile management with avatars
- Contact blocking
- Multi-device session management
- Dark/Light/System theme support
- English and Farsi localization
- GPU-accelerated animations with low-end device fallbacks

## Quick Start

### Prerequisites
- Node.js >= 20
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### 1. Clone and Install

```bash
git clone <repository-url>
cd rakhshan-chat
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure

```bash
cd infra/docker
docker compose up -d postgres redis minio
```

### 4. Database Setup

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Backend

```bash
npm run backend:start
```

The API will be available at `http://localhost:3000`.
Swagger docs at `http://localhost:3000/api/docs`.

### 6. Start Mobile App

```bash
npm run mobile:start
```

Scan the QR code with Expo Go, or press `i` for iOS simulator / `a` for Android emulator.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/verify` | Request OTP verification |
| POST | `/api/v1/auth/register` | Register new account |
| POST | `/api/v1/auth/login` | Login with OTP |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/users/me` | Get current user profile |
| PUT | `/api/v1/users/me` | Update profile |
| GET | `/api/v1/users/search` | Search users |
| GET | `/api/v1/chats` | List user's chats |
| POST | `/api/v1/chats/private` | Create private chat |
| POST | `/api/v1/chats/group` | Create group chat |
| GET | `/api/v1/messages/chat/:id` | Get chat messages |
| POST | `/api/v1/messages` | Send message |
| GET | `/api/v1/calls/history` | Call history |
| POST | `/api/v1/media/upload-url` | Get upload URL |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client -> Server | Send a message |
| `message:new` | Server -> Client | New message received |
| `message:delivered` | Server -> Client | Message delivery confirmation |
| `message:read` | Bidirectional | Mark messages as read |
| `typing:start/stop` | Client -> Server | Typing indicators |
| `typing:update` | Server -> Client | Typing status broadcast |
| `presence:update` | Server -> Client | User online/offline |
| `call:signal` | Bidirectional | WebRTC signaling |
| `sync:request/response` | Bidirectional | Offline message sync |

## Security

- All messages encrypted end-to-end using NaCl box (Curve25519 + XSalsa20-Poly1305)
- No plaintext message content stored on server
- Media files encrypted with AES-256-GCM
- JWT tokens with short expiry + refresh token rotation
- Rate limiting on auth and API endpoints
- Helmet security headers
- Input validation with Zod schemas
- SQL injection prevention via Prisma parameterized queries

## Project Structure Details

### Mobile App (`apps/mobile/src/`)
- `app/` - Entry point, providers, navigation
- `features/` - Feature modules (auth, chat, calls, profile, settings)
- `components/` - Reusable UI components, animations, visual effects
- `hooks/` - Custom React hooks
- `services/` - API client, WebSocket, encryption
- `store/` - Zustand state management
- `theme/` - Colors, typography, spacing
- `localization/` - i18n translations
- `utils/` - Configuration, storage utilities
- `types/` - TypeScript type definitions

### Backend (`apps/backend/src/`)
- `modules/` - Feature modules (auth, users, chats, messages, calls, media, notifications)
- `websocket/` - WebSocket gateway, connection management
- `encryption/` - Server-side cryptographic operations
- `database/` - Prisma service and database module
- `config/` - Redis and configuration modules
- `common/` - Guards, decorators, filters

## License

Private - All rights reserved.
