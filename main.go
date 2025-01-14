package main

import (
	"flag"
	"log/slog"
	"net/http"
	"time"

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
	server := &http.Server{
		Addr:         *address,
		Handler:      webApi,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		slog.Error("Failed to start server", "error", err)
	}
}
