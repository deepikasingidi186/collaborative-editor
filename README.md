# Real-Time Collaborative Text Editor (Operational Transformation)

## Overview

This project is a real-time collaborative text editor backend built using:

- Node.js
- Express
- WebSockets (ws)
- PostgreSQL
- Docker & Docker Compose

It implements the **Operational Transformation (OT)** algorithm to handle concurrent edits from multiple users while ensuring consistency and conflict resolution.

This system is similar in concept to collaborative tools like Google Docs.

---

## Features

- REST API for document management
- WebSocket real-time collaboration
- Deterministic Operational Transformation
- Version tracking
- Cursor synchronization
- User join/leave notifications
- PostgreSQL persistence
- Fully Dockerized deployment
- Windows-compatible WebSocket testing

---

## Architecture

### Components

1. **REST API (Express)**
   - Create document
   - List documents
   - Get document
   - Delete document

2. **WebSocket Server**
   - JOIN
   - OPERATION
   - CURSOR
   - LEAVE

3. **Operational Transformation Engine**
   - insert vs insert
   - insert vs delete
   - delete vs insert
   - delete vs delete
   - Deterministic tie-breaking using userId

4. **Database**
   - PostgreSQL
   - Persistent document storage
   - Version control

---

## Project Structure


collaborative-editor/
│
├── app/
│ ├── package.json
│ └── src/
│ └── server.js
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── test-websocket.bat
└── README.md


---

## Setup Instructions

### 1. Clone Repository


git clone <your-repo-url>
cd collaborative-editor


### 2. Start Application


docker-compose up --build


Application will run on:


http://localhost:8080


---

## Environment Variables

See `.env.example`


DATABASE_URL=postgresql://user:password@db:5432/collaboratordb
APP_PORT=8080


---

## REST API Endpoints

### Create Document

POST `/api/documents`


{
"title": "string",
"content": "string"
}


### List Documents

GET `/api/documents`

### Get Document

GET `/api/documents/{id}`

### Delete Document

DELETE `/api/documents/{id}`

---

## WebSocket API

Endpoint:


ws://localhost:8080


### JOIN


{
"type": "JOIN",
"documentId": "uuid",
"userId": "string",
"username": "string"
}


### OPERATION


{
"type": "OPERATION",
"documentId": "uuid",
"userId": "string",
"operation": {
"type": "insert" | "delete",
"position": number,
"text": string,
"length": number
},
"clientVersion": number
}


### CURSOR


{
"type": "CURSOR",
"documentId": "uuid",
"userId": "string",
"position": number
}


### LEAVE


{
"type": "LEAVE",
"documentId": "uuid",
"userId": "string"
}


---

## Testing

Use:


websocat ws://localhost:8080


Or run:


test-websocket.bat


---

## Operational Transformation Logic

The server:

1. Maintains a version number per document.
2. Stores operation history.
3. Transforms incoming operations against operations applied after the client's version.
4. Applies transformed operation.
5. Broadcasts to other clients.
6. Persists state to database.

This guarantees:

- No lost updates
- Deterministic conflict resolution
- Convergence across clients

---

## Example Conflict Resolution

Initial content:


abc


User A inserts `X` at position 0  
User B inserts `Y` at position 3  

Final deterministic result:


XabcY


Version = 2

---

## Requirements Covered

- Dockerized deployment
- PostgreSQL persistence
- Health checks
- REST API
- WebSocket real-time collaboration
- Deterministic OT conflict resolution
- Session cleanup
- Cursor broadcasting
- Leave handling
- Version management

---

## Author

Real-time collaborative editor backend implementation with full Operational Transformation support.