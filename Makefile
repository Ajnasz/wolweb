.PHONY: all build-ui install-ui

all: clean install-ui build-ui build/wolweb

install-ui:
	cd ui/wolweb && npm install

build-ui:
	cd ui/wolweb && npm run build

build/wolweb:
	go build -o build/wolweb


clean:
	rm -rf build
	rm -rf ui/wolweb/node_modules
	rm -rf ui/wolweb/dist

