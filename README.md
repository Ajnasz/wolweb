# WolWeb

Wake on LAN web application. WolWeb allows you to remotely wake up devices on your network using their MAC addresses. This is particularly useful for managing devices that support Wake-on-LAN (WoL) functionality.

![image](https://github.com/user-attachments/assets/277d750e-89e2-4f22-a2cc-59f9986ab206)


## Configuration

To configure WolWeb, create a YAML file with the following structure. This file contains the MAC addresses of the devices you want to wake up.


config.yaml

```yaml
MacAddresses:
  - name: "Display Name of Device 1"
    address: "00:11:22:00:00:00"
  - name: "Display Name of Device 2"
    address: "00:11:22:00:00:01"
  - name: "Display Name of Device 3"
    address: "00:11:22:00:00:02"
  - name: "Display Name of Device 4"
    address: "00:11:22:00:00:03"
```

## Usage

```bash
$ wolweb -config /path/to/config.yaml
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
