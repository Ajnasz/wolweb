package main

import (
	"flag"
	"log/slog"
	"net/http"

	"github.com/Ajnasz/wolweb/internal/api"
	"github.com/Ajnasz/wolweb/internal/config"
)

func main() {
	configPath := flag.String("config", "", "Path to the configuration file")
	address := flag.String("address", ":8951", "Address to listen on")
	flag.Parse()

	conf, err := config.New(*configPath)
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
	}

	webApi, err := api.New(conf)
	if err != nil {
		slog.Error("Failed to create web api", "error", err)
	}

	slog.Info("Starting server", "address", *address)
	if err := http.ListenAndServe(*address, webApi); err != nil {
		if err != http.ErrServerClosed {
			slog.Error("Failed to start server", "error", err)
		}
	}
}
