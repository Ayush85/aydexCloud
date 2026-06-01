FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod ./
COPY *.go ./

ENV GOFLAGS="-mod=mod"
RUN go mod download && go build -ldflags="-s -w" -o tracker .

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/tracker .

EXPOSE 3001

CMD ["./tracker"]
