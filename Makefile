.PHONY: all build-ui install-ui

all: install-ui build-ui wolweb

install-ui:
	cd ui/wolweb && npm install

build-ui:
	cd ui/wolweb && npm run build

wolweb:
	go build -o wolweb

