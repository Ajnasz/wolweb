package main

import (
	"flag"
	"log"

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

	webApi.Run(*address)
}
