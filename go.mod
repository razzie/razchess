module github.com/razzie/razchess

go 1.19

require (
	github.com/go-redis/redis/v8 v8.11.5
	github.com/notnil/chess v1.9.0-c26649c
	github.com/razzie/jsonrpc v0.0.0-20230101121601-7e74c3bf4ae5
	golang.org/x/net v0.4.0
)

require (
	github.com/cespare/xxhash/v2 v2.1.2 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
)

replace github.com/notnil/chess => github.com/razzie/chess v1.9.0-c26649c
