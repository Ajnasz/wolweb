package ui

import (
	"embed"
	"io/fs"
)

// Content holds our static web server content.
//
//go:embed wolweb/dist/*
var content embed.FS

// Get returns the ui file system
func Get() (fs.FS, error) {
	return fs.Sub(content, "wolweb/dist")
}
