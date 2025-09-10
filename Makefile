BINARY_NAME := wolweb
VERSION := $(shell git describe --tags)
BUILD := $(shell date +%FT%T%z)

.PHONY: all build-ui install-ui

run:
	go run -ldflags "-X main.version=${VERSION} -X main.build=${BUILD}" main.go

all: install-ui build-ui build/wolweb build/sha256.sum

install-ui:
	cd ui/wolweb && npm install

build-ui:
	cd ui/wolweb && npm run build

.PHONY: build/wolweb
build/wolweb: build/${BINARY_NAME}.linux.amd64 build/${BINARY_NAME}.linux.arm64 build/${BINARY_NAME}.linux.arm build/${BINARY_NAME}.darwin.amd64 build/${BINARY_NAME}.darwin.arm64 build/${BINARY_NAME}.windows.amd64 build/${BINARY_NAME}.windows.arm64 build/${BINARY_NAME}.windows.arm build/${BINARY_NAME}.freebsd.amd64 build/${BINARY_NAME}.freebsd.arm64

build/${BINARY_NAME}.linux.amd64:
	@CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.linux.arm64:
	@CGO_ENABLED=0 GOARCH=arm64 GOOS=linux go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.linux.arm:
	@CGO_ENABLED=0 GOARCH=arm64 GOOS=linux go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.darwin.amd64:
	@CGO_ENABLED=0 GOARCH=amd64 GOOS=darwin go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.darwin.arm64:
	@CGO_ENABLED=0 GOARCH=arm64 GOOS=darwin go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.windows.amd64:
	@CGO_ENABLED=0 GOARCH=amd64 GOOS=windows go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.windows.arm64:
	@CGO_ENABLED=0 GOARCH=arm64 GOOS=windows go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.windows.arm:
	@CGO_ENABLED=0 GOARCH=arm64 GOOS=windows go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.freebsd.amd64:
	@CGO_ENABLED=0 GOARCH=amd64 GOOS=freebsd go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@

build/${BINARY_NAME}.freebsd.arm64:
	@CGO_ENABLED=0 GOARCH=arm64 GOOS=freebsd go build ${BUILD_ARGS} -ldflags "-w -s -X main.version=${VERSION} -X main.build=${BUILD}" -o $@


build/sha256.sum: build/wolweb
	@cd $(@D) && sha256sum $(BINARY_NAME).* > $(@F)

clean:
	rm -rf build
	rm -rf ui/wolweb/node_modules
	rm -rf ui/wolweb/dist
