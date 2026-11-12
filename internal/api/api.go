package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"

	"github.com/Ajnasz/wol"
	"github.com/Ajnasz/wolweb/internal/config"
	"github.com/Ajnasz/wolweb/internal/services"
	"github.com/Ajnasz/wolweb/ui"
)

type WoLRequestDTO struct {
	MacAddr       string `json:"mac_addr"`
	BroadcastAddr string `json:"broadcast_addr"`
}

type DeviceResponseDTO struct {
	Name    string `json:"Name"`
	Address string `json:"Address"`
	Host    string `json:"Host"`
}

func woLDevicetoResponseDTO(device config.WoLDevice) DeviceResponseDTO {
	return DeviceResponseDTO{
		Name:    device.Name,
		Address: device.Address.String(),
		Host:    device.Host,
	}
}

type API struct{}

func wakeOnLan(req WoLRequestDTO) error {
	netService := services.WolService{}
	macAddr, err := net.ParseMAC(req.MacAddr)
	if err != nil {
		return err
	}
	return netService.WoL(macAddr, req.BroadcastAddr)
}

func handleWoL(logger *slog.Logger, conf *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req WoLRequestDTO
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		hwAddr, err := net.ParseMAC(req.MacAddr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid MAC address"})
			return
		}
		if conf.OnlyRegisteredDevices && conf.FindByMac(hwAddr) == nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "device not registered"})
			return
		}

		if err := wakeOnLan(req); err != nil {
			logger.Error("Failed to send WoL", "error", err, "mac", req.MacAddr)
			if errors.Is(err, wol.ErrInvalidMACAddress) {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "success"})
	}
}

func handleMacs(conf *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		addresses := make([]DeviceResponseDTO, len(conf.MacAddresses))
		for i, device := range conf.MacAddresses {
			addresses[i] = woLDevicetoResponseDTO(device)
		}
		json.NewEncoder(w).Encode(map[string]any{"macs": addresses})
	}
}

func handlePing(logger *slog.Logger, conf *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		macValue := r.PathValue("mac")
		hwAddr, err := net.ParseMAC(macValue)

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid MAC address"})
			return
		}
		mac := conf.FindByMac(hwAddr)

		if mac == nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "configuration not found", "mac": macValue})
			return
		}

		name := mac.Name
		if mac.Host == "" {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "no IP configured", name: name, "mac": macValue})
			return
		}

		pinger := services.PingService{
			Privileged: conf.PrivilegedPing,
		}
		ok, err := pinger.Ping(mac.Host)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error(), name: name})
			logger.Error("Failed to ping", "error", err, "host", mac.Host, "name", name)
			return
		}
		if ok {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"status": "ok", name: name})
			logger.Info("Ping successful", "host", mac.Host, "name", name)
			return
		}

		logger.Warn("Ping failed", "host", mac.Host, "name", name)

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "failed", name: name})

	}
}

func New(logger *slog.Logger, conf *config.Config) (*http.ServeMux, error) {
	mux := http.NewServeMux()
	static, err := ui.Get()
	if err != nil {
		return nil, err
	}
	mux.Handle("/", http.FileServer(http.FS(static)))
	mux.HandleFunc("POST /api/wol", handleWoL(logger, conf))
	mux.HandleFunc("GET /api/macs", handleMacs(conf))
	mux.HandleFunc("GET /api/ping/{mac}", handlePing(logger, conf))

	return mux, nil
}
