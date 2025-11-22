# JS Cache

JS Cache is a Redis-compatible in-memory cache in Node.js. This project is made to demonstrate the fundamentals of Redis and similar key-value data stores.

## Features

- Zero run-time dependencies
- Interact using Redis-CLI (RESP)
- Configurable persistence via Append-Only Files (AOF)
- Existing Redis commands supported

## Installation

```
npm install
```

## Running the server

```
npm run dev
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
- Redis data structures
- Improved AOF implementation

## Supported Commands

### String Commands

GET, SET, MGET, MSET, STRLEN, GETRANGE, SETRANGE, GETDEL, APPEND, INCR, INCRBY, DECR, DECRBY

### List Commands

LPUSH, RPUSH, LPOP, RPOP, LLEN, LRANGE, LINDEX, LSET, LTRIM

### Set Commands

SADD, SREM, SMEMBERS, SCARD, SISMEMBER, SMISMEMBER, SUNION, SINTER, SDIFF

### Key Commands

DEL, EXISTS, RENAME, TYPE

### Server Commands

FLUSHALL, PING, ECHO

## Roadmap

- ✅ RESP serialization/deserialization
- ✅ Basic key-value operations
- ✅ Append-Only File (AOF) persistence
- ✅ TCP server with graceful shutdown
- ✅ String commands
- ✅ List commands
- ✅ Set commands
- [ ] Hash commands
- [ ] Sorted set commands
- [ ] Misc. server commands
- [ ] Expiration and TTL
- [ ] Improved AOF persistence
- [ ] Multiple eviction strategies
- [ ] Indexing
- [ ] ACL
