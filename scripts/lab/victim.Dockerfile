FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      openssh-server \
      iproute2 \
      iputils-ping \
      curl \
      dnsutils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /run/sshd
