# JS Cache

JS Cache is a Redis-compatible in-memory cache in Node.js. This project is made to demonstrate the fundamentals of Redis and similar key-value data stores.

## Features

- Zero run-time dependencies
- Existing Redis commands supported
- Interact using Redis-CLI (RESP2)
- Configurable persistence via Append-Only Files (AOF)

## Installation

```bash
npm install
```

## Running the server

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Docker

### Build Docker Image

```bash
docker build -t js-cache:latest .
```

### Run Docker Container

```bash
docker run -d \
  --name js-cache \
  -p 6379:6379 \
  -v js-cache-data:/app/data \
  js-cache:latest
```

### Test with redis-cli

```bash
redis-cli -p 6379
PING  # Should return PONG
```

## Supported configurations

Additionally, provide a set of configurations at run-time using ENV variables

```
PORT = 6379 (or any valid port)
AOF_ENABLED = true (or false)
AOF_FILENAME = appendonly.aof (any supported filename)
```

## TODO

I'm planning to use this project as a learning reference to implement more features from Redis and similar solutions

- More Redis commands
- Redis data structures (sorted sets, hashes etc)
- Multiple eviction strategies
- Improved AOF implementation
- Access Control List

## Implemented Features

- ✅ RESP serialization/deserialization
- ✅ Key-value operations
- ✅ Append-Only File (AOF) persistence
- ✅ TCP server with graceful shutdown
- ✅ String commands
- ✅ List commands
- ✅ Set commands
- ✅ Misc. server commands
- ✅ Expiration and TTL

## Supported Commands

### String Commands

GET, SET (with NX, XX, EX, PX flags), MGET, MSET, STRLEN, GETRANGE, SETRANGE, GETDEL, APPEND, INCR, INCRBY, DECR, DECRBY

### List Commands

LPUSH, RPUSH, LPOP, RPOP, LLEN, LRANGE, LINDEX, LSET, LTRIM

### Set Commands

SADD, SREM, SMEMBERS, SCARD, SISMEMBER, SMISMEMBER, SUNION, SINTER, SDIFF

### Expiration / TTL Commands

EXPIRE, PEXPIRE, EXPIREAT, PEXPIREAT, TTL, PTTL, PERSIST

### Misc. Server Commands

FLUSHALL, PING, ECHO, DEL, EXISTS, RENAME, TYPE, KEYS
