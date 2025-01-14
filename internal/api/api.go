package api

import (
	"encoding/json"
	"errors"
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
	netService := services.NetService{}
	return netService.WoL(req.MacAddr, req.BroadcastAddr)
}

func handleWoL(w http.ResponseWriter, r *http.Request) {
	var req WoLRequestDAL
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := wakeOnLan(req); err != nil {
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

func New(conf *config.Config) (*http.ServeMux, error) {
	mux := http.NewServeMux()
	static, err := ui.Get()
	if err != nil {
		return nil, err
	}
	mux.Handle("/", http.FileServer(http.FS(static)))
	mux.HandleFunc("POST /api/wol", handleWoL)
	mux.HandleFunc("GET /api/macs", handleMacs(conf))

	return mux, nil
}
