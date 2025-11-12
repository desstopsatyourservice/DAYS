# DAYS - Desstops At Your Service ❣️

<img width="229" height="285" alt="image" src="https://github.com/user-attachments/assets/e8ef1d3c-aaba-4bff-9bb3-cff671f42e44" />

DAYS is a secure, cloud-based virtual desktop solution designed to empower workers and vendors to work from any location using any internet-enabled device. Our solution delivers a fully functional desktop environment hosted on public cloud with access to enterprise network, enabling seamless access to internal enterprise systems and collaborative tools.

To uphold data protection standards, the virtual desktops are intentionally isolated from direct internet access. This architecture ensures compliance with enterprise security policies, mitigates external threats, and supports regulatory requirements.

DAYS is also fully containerized! Just pull the containers, input your AWS Access Key, and you have a full-fledged Desktop-as-a-Service (DaaS) solution ready to go! 

We built DAYS on top of Apache Guacamole (https://guacamole.apache.org/) remote desktop gateway. Thanks, Apache!

## DAYS Server
An express server in node.js, written in typescript. 

Official Docker image here: https://hub.docker.com/r/desstopatyourservice/server/

Dockerfile here if you want to rebuild your own image: https://github.com/desstopsatyourservice/DAYS/blob/main/server/Dockerfile

## DAYS Client 
A react application written in typescript and hosted using nginx. 

Official Docker image here: https://hub.docker.com/r/desstopatyourservice/client/

Dockerfile here if you want to rebuild your own image: https://github.com/desstopsatyourservice/DAYS/blob/main/client/Dockerfile

## For the developers 💻
We use development containers for all developments, and you can refer to the respective devcontainers setup here:
- Server: https://github.com/desstopsatyourservice/DAYS/tree/main/server/.devcontainer
- Client: https://github.com/desstopsatyourservice/DAYS/tree/main/client/.devcontainer

This enables you to easily contribute to DAYS, even by using DAYS! 🙂
