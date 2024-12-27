package api

import (
	"github.com/Ajnasz/wolweb/internal/services"
	"github.com/gin-gonic/gin"
)

type WoLRequestDAL struct {
	MacAddr       string `json:"mac_addr"`
	BroadcastAddr string `json:"broadcast_addr"`
}

type API struct{}

func wakeOnLan(req WoLRequestDAL) error {
	netService := services.NetService{}

	return netService.WoL(req.MacAddr, req.BroadcastAddr)
}

func New() *gin.Engine {
	route := gin.Default()
	apiGroup := route.Group("/api")

	apiGroup.POST("/wol", func(c *gin.Context) {
		var req WoLRequestDAL
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		if err := wakeOnLan(req); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{"message": "success"})
	})

	return route
}
