#!/bin/bash

echo "Creating document..."
DOC_RESPONSE=$(curl -s -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"OT Test","content":"abc"}')

DOCUMENT_ID=$(echo $DOC_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

echo "Document ID: $DOCUMENT_ID"

sleep 1

echo "Starting Client A..."
( echo '{"type":"JOIN","documentId":"'$DOCUMENT_ID'","userId":"A","username":"Alice"}'
  sleep 1
  echo '{"type":"OPERATION","documentId":"'$DOCUMENT_ID'","userId":"A","operation":{"type":"insert","position":0,"text":"X"},"clientVersion":0}'
  sleep 2
) | websocat ws://localhost:8080 &

sleep 1

echo "Starting Client B..."
( echo '{"type":"JOIN","documentId":"'$DOCUMENT_ID'","userId":"B","username":"Bob"}'
  sleep 1
  echo '{"type":"OPERATION","documentId":"'$DOCUMENT_ID'","userId":"B","operation":{"type":"insert","position":3,"text":"Y"},"clientVersion":0}'
  sleep 2
) | websocat ws://localhost:8080 &

sleep 5

echo "Fetching final document state..."
curl -s http://localhost:8080/api/documents/$DOCUMENT_ID

echo ""
echo "Test completed."