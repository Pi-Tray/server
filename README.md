this readme needs to be done properly, but this isnt in working order yet so come back later :)

## Setup (make this better)

1. Clone the repository:
   ```bash
    git clone https://github.com/obfuscatedgenerated/pi-tray-server.git
    cd pi-tray-server
    ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Decide on a port you want the server to run on. By default this is 8080.
4. Create a connection between the Pi and the computer the server runs on. For me, I connect the Pi directly over Ethernet and assign it a static IP. (I should really do a writeup about this)
5. Determine the IP address of the interface that connects to your Pi. You probably don't want to be serving this on the public Internet, so I'd avoid `0.0.0.0`. Ths interface IP will be the same one you assigned to the interface if you used a direct connection.
6. You can now run the server with:
   ```bash
   npm run start -- -- --host=<host-ip> --port=<port>
   ``` 
   You'll probably want to run this at startup, but that depends on your OS.
7. You can now configure and subsequently build the [Pi-Tray client](https://github.com/obfuscatedgenerated/pi-tray) to connect to this server by setting the `VITE_WS_URL` environment variable in the client. This should be the URL of the server you just started, i.e., `ws://<host-ip>:<port>`.
8. Ensure the Pi can actually access the server! If you're directly connected, you'll probably need to make an exception in your OS firewall to allow the Pi to send inbound traffic on the port you chose.
