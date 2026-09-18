package services

import (
	"log/slog"
	"net"

	"github.com/Ajnasz/wol"
	"golang.org/x/sync/errgroup"
)

type WolService struct{}

func getBroadcastAddress(addr net.Addr) (string, error) {
	ipNet, ok := addr.(*net.IPNet)
	if !ok || ipNet.IP.To4() == nil {
		return "", nil
	}

	ip := ipNet.IP.To4()
	mask := ipNet.Mask
	broadcast := make(net.IP, len(ip))
	for i := range ip {
		broadcast[i] = ip[i] | ^mask[i]
	}

	return broadcast.String(), nil
}

func getBroadcastAddresses(iface net.Interface) ([]string, error) {
	var broadcastAddresses []string
	addrs, err := iface.Addrs()
	if err != nil {
		return []string{}, err
	}

	for _, addr := range addrs {
		broadcast, err := getBroadcastAddress(addr)
		if err == nil && broadcast != "" {
			broadcastAddresses = append(broadcastAddresses, broadcast)
		}
	}

	return broadcastAddresses, nil
}

func (WolService) getAvailableBroadcastAddresses() ([]string, error) {
	var broadcastAddresses []string
	ifaces, err := net.Interfaces()
	if err != nil {
		return broadcastAddresses, err
	}

	for _, iface := range ifaces {
		addresses, err := getBroadcastAddresses(iface)
		if err != nil {
			slog.Warn("Failed to get broadcast address for interface", "interface", iface.Name, "error", err)
			continue
		}
		broadcastAddresses = append(broadcastAddresses, addresses...)
	}

	return broadcastAddresses, nil
}

func (n WolService) WoL(macAddr string, broadcastAddress string) error {
	if broadcastAddress != "" {
		return wol.SendPacket(macAddr, broadcastAddress)
	}

	broadcastAddresses, err := n.getAvailableBroadcastAddresses()
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
