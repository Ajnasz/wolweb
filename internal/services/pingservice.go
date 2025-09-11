package services

import (
	"time"

	probing "github.com/prometheus-community/pro-bing"
)

type PingService struct {
}

func (PingService) Ping(address string) (bool, error) {
	pinger := probing.New(address)

	pinger.Count = 1
	pinger.ResolveTimeout = time.Second
	pinger.Timeout = time.Second

	err := pinger.Run()

	if err != nil {
		return false, err
	}

	stats := pinger.Statistics()

	return stats.PacketLoss == 0, nil
}
