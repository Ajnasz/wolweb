package main

import (
	"flag"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Ajnasz/wolweb/internal/api"
	"github.com/Ajnasz/wolweb/internal/config"
)

func main() {
	configPath := flag.String("config", "", "Path to the configuration file")
	address := flag.String("address", ":8951", "Address to listen on")
	flag.Parse()
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	conf, err := config.New(*configPath)
	if err != nil {
		logger.Error("Failed to load configuration", "error", err)
	}

	webApi, err := api.New(logger, conf)
	if err != nil {
		logger.Error("Failed to create web api", "error", err)
	}

	logger.Info("Starting server", "address", *address)
	server := &http.Server{
		Addr:         *address,
		Handler:      webApi,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		logger.Error("Failed to start server", "error", err)
	}
}
