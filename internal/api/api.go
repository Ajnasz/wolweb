package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/Ajnasz/wol"
	"github.com/Ajnasz/wolweb/internal/config"
	"github.com/Ajnasz/wolweb/internal/services"
	"github.com/Ajnasz/wolweb/ui"
)

type WoLRequestDAL struct {
	MacAddr       string `json:"mac_addr"`
	BroadcastAddr string `json:"broadcast_addr"`
}

type API struct{}

func wakeOnLan(req WoLRequestDAL) error {
	netService := services.WolService{}
	return netService.WoL(req.MacAddr, req.BroadcastAddr)
}

func handleWoL(w http.ResponseWriter, r *http.Request) {
	var req WoLRequestDAL
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := wakeOnLan(req); err != nil {
		slog.Error("Failed to send WoL", "error", err, "mac", req.MacAddr)
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

func handleMacs(conf *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"macs": conf.MacAddresses})
	}
}

func handlePing(conf *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")
		mac := conf.FindByMac(name)

		if mac == nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "configuration not found", name: name})
			return
		}

		if mac.Host == "" {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "no IP configured", name: name})
		}

		pinger := services.PingService{}
		ok, err := pinger.Ping(mac.Host)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error(), name: name})
			return
		}
		if ok {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"status": "ok", name: name})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "failed", name: name})

	}
}

func New(conf *config.Config) (*http.ServeMux, error) {
	mux := http.NewServeMux()
	static, err := ui.Get()
	if err != nil {
		return nil, err
	}
	mux.Handle("/", http.FileServer(http.FS(static)))
	mux.HandleFunc("POST /api/wol", handleWoL)
	mux.HandleFunc("GET /api/macs", handleMacs(conf))
	mux.HandleFunc("GET /api/ping/{name}", handlePing(conf))

	return mux, nil
}
