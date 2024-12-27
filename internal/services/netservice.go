package services

import (
	"fmt"
	"net"

	"github.com/Ajnasz/wol"
	"golang.org/x/sync/errgroup"
)

func main() {
	fmt.Println("vim-go")
}

type NetService struct{}

func (NetService) GetAvailableBroadcastAddresses() ([]string, error) {
	var broadcastAddresses []string
	ifaces, err := net.Interfaces()
	if err != nil {
		return broadcastAddresses, err
	}

	for _, iface := range ifaces {
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			ipNet, ok := addr.(*net.IPNet)
			if !ok || ipNet.IP.To4() == nil {
				continue
			}

			ip := ipNet.IP.To4()
			mask := ipNet.Mask
			broadcast := make(net.IP, len(ip))
			for i := 0; i < len(ip); i++ {
				broadcast[i] = ip[i] | ^mask[i]
			}
			broadcastAddresses = append(broadcastAddresses, broadcast.String())
		}
	}

	return broadcastAddresses, nil
}

func (n NetService) WoL(macAddr string, broadcastAddress string) error {
	if broadcastAddress == "" {
		return wol.SendPacket(macAddr, broadcastAddress)
	}

	broadcastAddresses, err := n.GetAvailableBroadcastAddresses()
	if err != nil {
		return err
	}

	g := new(errgroup.Group)

	for _, broadcastAddress := range broadcastAddresses {
		g.Go(func() error {
			return wol.SendPacket(macAddr, broadcastAddress)
		})

	}

	err = g.Wait()
	return err
}
