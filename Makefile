.PHONY: all build-ui install-ui

all: install-ui build-ui build/wolweb

install-ui:
	cd ui/wolweb && npm install

build-ui:
	cd ui/wolweb && npm run build

build/wolweb:
	go build -o build/wolweb

