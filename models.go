package main

import (
	"github.com/gorilla/websocket"
)

type Player struct {
	conn *websocket.Conn
	name string
	room string
}

type Room struct {
	host Player
	players []Player
	started bool
}