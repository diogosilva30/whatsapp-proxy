.PHONY: build push build-push help

# Variables
DOCKER_USERNAME := spamz23
IMAGE_NAME := whatsapp-proxy
VERSION := latest
PLATFORMS := linux/amd64,linux/arm64

# Default target
help:
	@echo "Available targets:"
	@echo "  make build       - Build multi-architecture Docker image"
	@echo "  make push        - Push image to Docker Hub"
	@echo "  make build-push  - Build and push in one step"
	@echo "  make run         - Run with docker-compose"
	@echo "  make stop        - Stop docker-compose"
	@echo "  make logs        - View docker-compose logs"

# Build multi-architecture image
build:
	@echo "Building multi-architecture image..."
	docker buildx build \
		--platform $(PLATFORMS) \
		-t $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION) \
		.

# Push to Docker Hub
push:
	@echo "Building and pushing to Docker Hub..."
	docker buildx build \
		--platform $(PLATFORMS) \
		-t $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION) \
		--push \
		.

# Build and push in one command
build-push: push

# Local development with docker-compose
run:
	docker-compose up -d

# Stop docker-compose
stop:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Rebuild and restart
restart:
	docker-compose up -d --build
