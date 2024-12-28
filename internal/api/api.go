package api

import (
	"errors"
	"fmt"

	"github.com/Ajnasz/wol"
	"github.com/Ajnasz/wolweb/internal/config"
	"github.com/Ajnasz/wolweb/internal/services"
	"github.com/Ajnasz/wolweb/ui"
	"github.com/gin-contrib/static"
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

func New(conf *config.Config) (*gin.Engine, error) {
	route := gin.Default()
	route.Use(static.Serve("/", static.EmbedFolder(ui.Content, "wolweb/dist")))
	apiGroup := route.Group("/api")
	{

		apiGroup.POST("/wol", func(c *gin.Context) {
			var req WoLRequestDAL
			if err := c.BindJSON(&req); err != nil {
				c.JSON(400, gin.H{"error": err.Error()})
				return
			}

			if err := wakeOnLan(req); err != nil {
				fmt.Println(err)
				if errors.Is(err, wol.ErrInvalidMACAddress) {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}

			c.JSON(200, gin.H{"message": "success"})
		})
		apiGroup.GET("/macs", func(c *gin.Context) {
			c.JSON(200, gin.H{"macs": conf.MacAddresses})
		})
	}

	return route, nil
}
