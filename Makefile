# GNU make; on Windows run it from Git Bash. A colon in a target name has to be
# escaped, hence build\:windows.

# The version stamped into the binary. "dev" is the honest default for a build
# from a working tree: make build:windows VERSION=v1.0.0
VERSION ?= dev

.PHONY: build\:windows test fmt

build\:windows:
	wails build -platform windows/amd64 -ldflags "-X main.version=$(VERSION)"

test:
	go test ./...

fmt:
	gofmt -l .
