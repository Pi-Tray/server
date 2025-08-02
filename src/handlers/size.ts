export default ((ws, payload) => {
    // just send dummy data for now

    ws.send(JSON.stringify({
        action: "size",
        payload: {
            cols: 8,
            rows: 4
        }
    }));
}) as MessageHandler;
