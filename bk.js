const { execSync } = require("child_process");
const express = require("express");
const ws = require("ws");

let rooms = {};


// funkcje związane z grą które warto mieć tutaj
function roomExists(name) {
    let toReturn = false;
    if(rooms[name]) {
        toReturn = true;
    }

    return toReturn;
}

function randomCharset() {
    // losowe znaki do id gier
    let kb = "rfvtgbyhn".split("") //array
    let final = ""; //lekko zmieniony generator room id, żeby było można szybciej dołączyć do pokoju #qwe

    let dLength = 4 // zmiana tej wartości zmieni długość każdego id
    let c = 0;

    while(c !== dLength) {
        final += kb[Math.floor(Math.random() * kb.length)];
        c += 1;
    }

    final = final.toUpperCase() // jak id nie mają być dużymi literami zapisane to można to usunąć

    return final;
}
function plsNoXSS(text) {
    return text.split("<").join("˂").split(">").join("˃");
}



// hostujemy webserver na porcie 80
const app = express();
app.listen(80, () => {
    console.log('wyscigi_pociagow');
});



app.get('/api/join_room', (req,res) => {
    let roomName = req.originalUrl.split("?room=")[1].toUpperCase()
    let ok = true;
    let message = "";

    if(roomExists(roomName) == false) {
        ok = false;
        message = "podałeś zły kod lub ten pokój nie istnieje"
    }
    
    res.send({
        "ok": ok,
        "message": message
    })
});

app.get('/api/create_room', (req,res) => {
    let roomName = randomCharset();

    if(roomExists(roomName) == true) {
        roomName = randomCharset();
    }
    
    res.send({
        "room_id": roomName
    })
});


app.get('/', (req,res) => {
    res.redirect("index.html");
})
app.use(express.static("./"));






// skarpetka sieciowa na porcie 171
const server = new ws.Server({
    port: 171
  });
  
  let sockets = [];
  server.on('connection', function(socket) {
    // gracz dołączył, nice

    socket.on('message', function(msg) {
        let m = JSON.parse(msg)
        switch(m.type) {
            case "hello":
                let name = m.name;
                let id = m["join_id"];

                socket["name"] = plsNoXSS(name);
                socket["roomid"] = id;

                console.log(name, id);
                
                if(!rooms[id]) {
                    rooms[id] = {}
                    rooms[id]["players"] = []
                    rooms[id]["code"] = id;
                };
                
                // czy w pokoju jest gracz o takim samym nicku?
		let e = false;
		rooms[id].players.forEach(s => {
			if (s.name == name) return e = true;
		});
		
		if (e) {
			socket["name"] = "";
			socket["roomid"] = "";

                   	return socket.send(JSON.stringify({
                        	"type": "alertMessage",
                       		"value": "w grze jest już gracz o takiej nazwie."
                   	}));
		}

                // czy gra w pokoju już się zaczęła?
                if(rooms[id].started !== true) {

                    // nie
                    let room = rooms[id];

                    room.players.push(socket)
                    room["latestChat"] = name + " dołącza."
                    room.players.forEach(s => s.send(JSON.stringify({
                        "type": "roomChat",
                        "value": room["latestChat"]
                    })));
                    room.players.forEach(s => s.send(JSON.stringify({
                        "type": "roomCode",
                        "value": id
                    })));
                    
    
                    if(room.players[0] == socket) {
                        // pierwszy gracz, zostaje hostem
                        room["host"] = socket
                        room["host"].send(JSON.stringify({
                            "type": "hostNotif",
                            "value": "h"
                        }));
                    }
                } else {
                    // tak
                    socket["name"] = "";
                    socket["roomid"] = "";

                    socket.send(JSON.stringify({
                        "type": "alertMessage",
                        "value": "gra się już zaczęła."
                    }));
                }

                
                break;
            case "host_start":
                let room = rooms[socket["roomid"]];

                // czy ten gość jest faktycznie hostem????
                if(socket["name"] == room.host["name"] || room.started == true) {
                    // jest!


                    // no dobra, ale czy jest więcej niż 2 graczy?
                    if(room.players.length >= 1) { // minimum 2 graczy tymczasowo usunięty, jestem ciekaw czy singleplayer działa #qwe
                        // jeszcze jak
                        rooms[socket["roomid"]].started = true;
                        room.players.forEach(s => s.send(JSON.stringify({
                            "type": "roomStarted",
                            "value": true
                        })));



                        // sama gra


                        let p = ["Paliwa nalałeś na 2cm ruchu", "Powerbank wybuchł", "Pociąg zapadł w depresję", "Pociąg został planetą", "pociąg nie lubił właściciela", "TheTroll zjadł koła pociągu", "pzpl zjadł ci pociąg", "guam zjadł wagony", "Pieseł zjadł silnik", "SoGreeno wypił całe paliwo", , "Pociąg wpadł do /dev/null", "undefined", "Pociąg zapomniał jak jeździć", "Pociąg wymazał abl"];

			let pp = ["Z czego macie te pociągi? Z kartonu?","Może kupcie lepsze pociągi na następny raz?","Nie kupujcie pociągów z Allegro znowu, spoko?"]
                        


                        // przygotowania

                        room.playerPositions = {};
                        room.playerLost = {};
                        room.playerTrains = {};
                        room.players.forEach(player => {
                            room.playerPositions[player["name"]] = 0;
                            room.playerLost[player["name"]] = false;
                            room.playerTrains[player["name"]] = Math.floor(Math.random() * 3) + 1;
                        })


                        
                        room.players.forEach(s => s.send(JSON.stringify({
                            "type": "playerTrains",
                            "value": room.playerTrains
                        })));
                        room.players.forEach(s => s.send(JSON.stringify({
                            "type": "playerPositions",
                            "value": room.playerPositions
                        })));


                        let loseChance = 5;
                        let driveChance = 70;

                        let h = setInterval(function() {
                            room.players.forEach(player => {


                                if(room.playerLost[player["name"]] == false) {
                                    // jedziemy dalej
                                    if(Math.floor(Math.random() * 100) <= driveChance) {
                                        room.playerPositions[player["name"]] += 1;
                                    };

                                    // wykoleił się
                                    if(Math.floor(Math.random() * 100) <= loseChance) {
                                        room.playerLost[player["name"]] = true;
                                        let reason = p[Math.floor(Math.random() * p.length)];
					let reasonall = pp[Math.floor(Math.random() * pp.length)];
                                        room.players.forEach(s => s.send(JSON.stringify({
                                            "type": "roomChat",
                                            "value": player["name"] + " przegrał. powód: " + reason
                                        })));

                                        // sprawdzamy czy przypadkiem się wszyscy już nie wykoleili
                                        let a = [];
                                        for(let i in room.playerLost) {
                                            a.push(room.playerLost[i])
                                        };

                                        if(a.includes(false) == false) {
                                            // a jednak
                                            room.players.forEach(s => s.send(JSON.stringify({
                                                "type": "roomChat",
                                                "value": "Wszyscy się wykoleili... " + reasonall
                                            })));
                                            room.players.forEach(s => s.send(JSON.stringify({
                                                "type": "roomChat",
                                                "value": "Za 5 sekund będzie można zacząć nową grę."
                                            })));
                                            clearInterval(h)
                                            setTimeout(function() {
                                                room.started = false;
                                                room.playerPositions = {};
                                                room.playerLost = {};
                                                room.playerTrains = {};
                                                room.players.forEach(player => {
                                                    room.playerPositions[player["name"]] = 0;
                                                    room.playerLost[player["name"]] = false;
                                                    room.playerTrains[player["name"]] = Math.floor(Math.random() * 3) + 1;
                                                })
                                                room.players.forEach(s => s.send(JSON.stringify({
                                                    "type": "chatClear",
                                                    "value": "h"
                                                })))
                                                room["host"].send(JSON.stringify({
                                                    "type": "hostNotif",
                                                    "value": "h"
                                                }))
                                            }, 5000)
                                        }
                                    }
                                }


                            })



                            room.players.forEach(s => s.send(JSON.stringify({
                                "type": "playerPositions",
                                "value": room.playerPositions
                            })));

                            for(let i in room.playerPositions) {
                                if(room.playerPositions[i] >= 9) {
                                    room.players.forEach(s => s.send(JSON.stringify({
                                        "type": "roomChat",
                                        "value": "GG " + i + ", dojechał do mety!"
                                    })));
                                    room.players.forEach(s => s.send(JSON.stringify({
                                        "type": "roomChat",
                                        "value": "Za 5 sekund będzie można zacząć nową grę."
                                    })));
                                    clearInterval(h);
                                    setTimeout(function() {
                                        room.started = false;
                                        room.playerPositions = {};
                                        room.playerLost = {};
                                        room.playerTrains = {};
                                        room.players.forEach(player => {
                                            room.playerPositions[player["name"]] = 0;
                                            room.playerLost[player["name"]] = false;
                                            room.playerTrains[player["name"]] = Math.floor(Math.random() * 3) + 1;
                                        })
                                        room.players.forEach(s => s.send(JSON.stringify({
                                            "type": "chatClear",
                                            "value": "h"
                                        })))
                                        room["host"].send(JSON.stringify({
                                            "type": "hostNotif",
                                            "value": "h"
                                        }))
                                    }, 5000);
                                }
                            } 
                            
                        }, 1000);
                    



                    } else {
                        socket.send(JSON.stringify({
                            "type": "alertMessage",
                            "value": "potrzeba co najmniej 2 graczy. znajdź sobie znajomego do gry, bo tak zbytnio to nie działa samemu."
                        }));
                    }

                    


                } else {
                    // lol nie
                    socket.send(JSON.stringify({
                        "type": "alertMessage",
                        "value": "chyba cie tramwaj potrącił."
                    }));
                }
                break;
        }
    });

    socket.on('close', function() {
        // gracz wyszedł

        let room = rooms[socket.roomid];

        // usuwamy go z arraya players
        room.players = room.players.filter((s => s !== socket));

        // wysyłamy do wszystkich wiadomość
        room["latestChat"] = socket["name"] + " wychodzi."
        room.players.forEach(s => s.send(JSON.stringify({
            "type": "roomChat",
            "value": room["latestChat"]
        })))

        // druga osoba zostaje hostem
        room["host"] = room.players[0];  
        room["host"].send(JSON.stringify({
            "type": "hostNotif",
            "value": "h"
        }))
    });
});


process.on("uncaughtException", function(ex) {
    console.log("błąd: " + ex.message);
    console.log("szczegóły:" + ex.stack);
});
