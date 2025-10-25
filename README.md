# JS Cache

JS Cache is a Redis-compatible in-memory cache in Javascript. This project is made to demonstrate the fundamentals of Redis and similar key-value data stores.

## Features

- Zero run-time dependencies
- Interact using Redis-CLI (RESP)
- Configurable persistence via Append-Only Files (AOF)
- Redis commands [GET, SET, EXISTS, DEL and FLUSHALL] supported

## Installation

```bash
npm install
```

## Running the server

```bash
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
