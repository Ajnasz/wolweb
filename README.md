# WolWeb

Wake on LAN web application. WolWeb allows you to remotely wake up devices on your network using their MAC addresses. This is particularly useful for managing devices that support Wake-on-LAN (WoL) functionality.

![image](https://github.com/user-attachments/assets/277d750e-89e2-4f22-a2cc-59f9986ab206)


## Configuration

To configure WolWeb, create a YAML file with the following structure. This file contains the MAC addresses of the devices you want to wake up.
If you set the `host` field, you will be able to ping the device to check if it is online.


config.yaml

```yaml
MacAddresses:
  - name: "Display Name of Device 1"
    address: "00:11:22:00:00:00"
    host: "192.168.1.2"
  - name: "Display Name of Device 2"
    address: "00:11:22:00:00:01"
    host: "192.168.1.3"
  - name: "Display Name of Device 3"
    address: "00:11:22:00:00:02"
  - name: "Display Name of Device 4"
    address: "00:11:22:00:00:03"
```

## Usage

```bash
$ wolweb -config /path/to/config.yaml
```

### Customizing the listening address and port

You can customize the address and port on which the WolWeb application listens by using the `-address` flag. The default address is `:8951`.

```bash
$ wolweb -config /path/to/config.yaml -address :8080
```

## Building the Golang App

To build the WolWeb application from source, follow these steps:

1. Ensure you have Go installed on your system. You can download it from [golang.org](https://golang.org/dl/).
2. Clone the repository:

```bash
git clone https://github.com/Ajnasz/wolweb.git
cd wolweb
```

3. Build the UI
4. 
```bash
cd ui/wolweb
npm install
npm run build
```

4. Build the application:

```bash
go build -o wolweb
```

5. The `wolweb` executable will be created in the current directory. You can now run it using:

```bash
./wolweb
```

## Building the Docker Image

To build the WolWeb application as a Docker image, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/Ajnasz/wolweb.git
```

2. Build the Docker image:

```bash
docker build -t wolweb .
```

## Running the Docker Container

1. Create a configuration file named `config.yaml` with the MAC addresses of the devices you want to wake up. You can use the example configuration provided above.

2. Pull the Docker image from the GitHub Container Registry or use the image you built in the previous step:

```bash
docker pull ghcr.io/ajnasz/wolweb:v1.1.2
```

3. Run the Docker container:

```bash
docker run -d --network host -v $PWD/config.yaml:/app/config.yaml ghcr.io/ajnasz/wolweb:v1.1.2
```

You must mount the configuration file as `/app/config.yaml` in the container. You can replace `$PWD/config.yaml` with the actual path to your configuration file.
You will need to set the network mode to `host` to allow the container to access network devices.

## Running as a Systemd Service

To run the WolWeb application as a systemd service, create a file named `wolweb.service` in `/etc/systemd/system/` with the following content:

```ini
[Unit]
Description=WolWeb Service
After=network.target

[Service]
ExecStart=/path/to/wolweb
Restart=always
User=nobody
Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
WorkingDirectory=/path/to/working/directory

[Install]
WantedBy=multi-user.target
```

Replace `/path/to/wolweb` with the actual path to the `wolweb` executable and `/path/to/working/directory` with the working directory for the service.

You can now create the systemd service file and enable it using the following commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable wolweb.service
sudo systemctl start wolweb.service
```
