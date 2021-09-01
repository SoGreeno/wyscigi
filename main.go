package main

import (
	"log"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.New()

	r.GET("/api/create_room", createRoom)
	r.GET("/api/join_room", joinRoom)

	r.GET("/ws", ws)

	r.Static("/static/", "./static")
	r.GET("/", func (c *gin.Context) {
		loc := url.URL{Path:"/static/"}
		c.Redirect(http.StatusFound, loc.RequestURI())
	})
	log.Fatalln(r.Run(":8080"))
}

func createRoom(c *gin.Context) {
	id := randomCharset(6)
	c.JSON(http.StatusCreated, gin.H{
		"roomId": id,
	})
}

func joinRoom(c *gin.Context) {
	_, ok := ROOMS[c.Query("room")] 
	c.JSON(http.StatusOK, gin.H{
		"ok": ok,
		"message": "ten pokój nie istnieje",
	})
}



