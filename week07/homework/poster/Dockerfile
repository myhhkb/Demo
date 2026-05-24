FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm install

COPY client/ .
RUN npm run build

FROM golang:1.21-alpine AS backend-builder

WORKDIR /app

RUN apk add --no-cache gcc musl-dev

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ .
RUN CGO_ENABLED=1 GOOS=linux go build -o server .

FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates sqlite

COPY --from=backend-builder /app/server .
COPY --from=frontend-builder /app/client/dist ./dist

RUN mkdir -p uploads

EXPOSE 8080

CMD ["./server"]
