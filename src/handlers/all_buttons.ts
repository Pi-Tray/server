export default ((ws, payload) => {
    // just send dummy data for now
    // TODO: bundle all buttons into one message

    ws.send(JSON.stringify({
        action: "set_text",
        payload: {
            x: 0,
            y: 0,
            text: "Hello, world!"
        }
    }));

    ws.send(JSON.stringify({
        action: "set_text",
        payload: {
            x: 7,
            y: 3,
            text: "database-zap",
            is_icon: true
        }
    }));

    setTimeout(() => {
        ws.send(JSON.stringify({
            action: "set_text",
            payload: {
                x: 0,
                y: 1,
                text: "Button 0,1"
            }
        }));
    }, 1000);

    setTimeout(() => {
        ws.send(JSON.stringify({
            action: "set_text",
            payload: {
                x: 0,
                y: 0,
                text: "Hi"
            }
        }));

        ws.send(JSON.stringify({
            action: "set_text",
            payload: {
                x: 7,
                y: 3,
                text: "veryinvalidicon",
                is_icon: true
            }
        }));
    }, 3000);
}) as MessageHandler;
