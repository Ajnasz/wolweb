package main

import "github.com/Ajnasz/wolweb/internal/api"

func main() {
	webApi := api.New()

	webApi.Run(":8951")
}
