TOPDIR = $(dir $(lastword $(MAKEFILE_LIST)))
VERSION = $(or ${TRAVIS_BUILD_ID}, LOCAL)
REGISTRY ?= $(or ${DOCKER_REGISTRY}, docker.io)
TAG ?= latest

.PHONY: all
all: build lint test

.PHONY: build
build:
	@docker build . --target dependencies --tag melonproject/manager-dependencies --cache-from melonproject/manager-dependencies
	@docker build . --target development 	--tag melonproject/manager-development  --cache-from melonproject/manager-dependencies,melonproject/manager-development
	@docker build . --target production  	--tag melonproject/manager-production	  --cache-from melonproject/manager-dependencies,melonproject/manager-development,melonproject/manager-production

.PHONY: lint
lint:
	@echo Skipping linting

.PHONY: test
test:
	@echo Skipping tests

# -----------------------------------------------------------------------------
# BUILD - CI
# -----------------------------------------------------------------------------
.PHONY: tag
tag:
	@docker tag melonproject/manager-production ${REGISTRY}/melonproject/manager:${VERSION}
	@docker tag melonproject/manager-production ${REGISTRY}/melonproject/manager:${TAG}

.PHONY: push
push:
	@docker push ${REGISTRY}/melonproject/manager:${VERSION}
	@docker push ${REGISTRY}/melonproject/manager:${TAG}

