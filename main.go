package main

import (
	"flag"
	"log"
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
		log.Fatal(err)
	}

	webApi, err := api.New(conf)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Starting server on %s\n", *address)
	if err := http.ListenAndServe(*address, webApi); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
