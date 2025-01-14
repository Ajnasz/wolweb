.PHONY: all build-ui install-ui

all: install-ui build-ui build/wolweb build/wolweb.sum

install-ui:
	cd ui/wolweb && npm install

build-ui:
	cd ui/wolweb && npm run build

build/wolweb:
	go build -o build/wolweb

build/wolweb.sum: build/wolweb
	@cd $(@D) && sha256sum $(<F) > $(@F)

clean:
	rm -rf build
	rm -rf ui/wolweb/node_modules
	rm -rf ui/wolweb/dist
