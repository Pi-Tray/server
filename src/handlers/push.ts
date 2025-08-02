export default ((ws, payload) => {
    // just ack the push for now

    ws.send(JSON.stringify({
        action: "push_ack",
        payload: {
            x: payload.x,
            y: payload.y,
        }
    }));
}) as MessageHandler;
