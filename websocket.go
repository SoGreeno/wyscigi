package main

import (
	"log"
	"encoding/json"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

var ROOMS = map[string]Room{}

func ws(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Fatalln(err)
	}
	defer conn.Close()

	conn.SetCloseHandler(nil)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Fatalln(err)
			break
		}

		payload := map[string]interface{}{}
		if err := json.Unmarshal(msg, &payload); err != nil {
			log.Fatalln(err)
		}

		switch payload["type"].(string) {
		case "hello":
			isNew := false
			id := payload["join_id"].(string)
			if _, ok := ROOMS[id]; !ok {
				ROOMS[id] = Room{
					players: []Player{},
					started: false,
				}
				isNew = true
			}
			room := ROOMS[id]

			if !room.started {
				room.players = append(room.players, Player{
					conn: conn,
					name: payload["name"].(string),
					room: payload["join_id"].(string),
				})

				for _, player := range room.players {
					player.conn.WriteJSON(map[string]interface{}{
						"type": "roomChat",
						"value": payload["name"].(string) + " dołącza.",
					})
					player.conn.WriteJSON(map[string]interface{}{
						"type": "roomCode",
						"value": id,
					})
				}

				if isNew {
					room.host = room.players[0]
					room.host.conn.WriteJSON(map[string]interface{}{
						"type": "hostNotif",
					})
				}
			}
		default:
			return
		}
	}
}