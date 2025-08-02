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
}) as MessageHandler;
