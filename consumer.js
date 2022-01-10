

const express = require('express');
const cors = require('cors');
const publisher = express();

publisher.use(cors());
publisher.use(express.json());


const amqp = require("amqplib");

const msg = { number: process.argv[2] }


function consume(queue, channel, id) {
    return new Promise((resolve, reject) => {
        channel.consume(queue, message => {
            let msg = JSON.parse(message.content.toString());
            let temp=`'${msg.id}'`;
            if (id == temp) {
                resolve({ x: msg.data.x, y: msg.data.y });
            }
        });
    });
}
async function connect(id) {
    try {
        const connection = await amqp.connect("amqp://localhost")
        const channel = await connection.createChannel();
        const result = await consume("add", channel, id);
        channel.close();
        connection.close();
        return { status: true, data: result };
    } catch (err) {
        return { status: false, reason: err };
    }
}


publisher.get('/', async (req, res) => {
    let id = req.query.id;
    console.log(id)
    if (id!==undefined) {
        let str = ``;
        const result = await connect(id);
        if (result.status) {
            let add = Number(result.data.x) + Number(result.data.y);
            str = `\n x=${result.data.x} and y=${result.data.y} result is ${add}`
            console.log(`result of add is ${add}`);
            res.send(str);
        }
        else {
            str = `cannot make request reason ${result.reason}`
        }
    } else {
        res.send('please send id for response');
    }
})

publisher.listen(3334, () => {
    console.log('consumer server listening at 3334 port number');
})


