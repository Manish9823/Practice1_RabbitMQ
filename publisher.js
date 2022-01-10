const express = require('express');
const cors = require('cors');
const uuid = require('uuid');
const publisher = express();

publisher.use(cors());
publisher.use(express.json());


const amqp = require("amqplib");

const msg = { number: process.argv[2] }



async function connect(msg) {
    try {
        const connection = await amqp.connect("amqp://localhost")
        const channel = await connection.createChannel();
        const result = await channel.assertQueue('add')
        console.log(msg)
        channel.sendToQueue('add', Buffer.from(JSON.stringify(msg)))
        console.log('job sent successfully for adding ');
        return { status: true, reason: null };
    }
    catch (err) {
        return { status: false, reason: err };
    }
}


publisher.post('/add', async (req, res) => {
    const id = uuid.v4();
    let msg = { id: id, data: req.body }
    let result = await connect(msg); //publishing to the rabbitmq queue name as 'add'
    if (result.status) {
        res.send(id);
    }
    else {
        res.send(`Request is failed reason is ${result.reason}`)
    }
})


publisher.get('/', (req, res) => {
    let str = `
    <html>
        <body>
            <h4>Adding two numbers</h4>
            <form>
                <p>
                    Enter 1st number :- <input type="number" required id="x" />
                    <br><br>
                    Enter 2nd number :- <input type="number" required id="y" />
                </p>
                <hr>
                <div id="res">
                    <input type="button" onClick="add()" id="addBtn" value="Add">
                </div>
            </form>
        </body>
        <script>
                let x;
                let y;
                function add(){
                    x=document.getElementById('x').value;
                    y=document.getElementById('y').value;
                    const xhr=new XMLHttpRequest();
                    xhr.open('POST','http://localhost:3333/add',true);
                    xhr.setRequestHeader("Content-Type","application/json");
                    xhr.onload=()=>{
                        if(xhr.status===200){
                            let str=xhr.response.toString();
                            let link="http://localhost:3334?id='"+str+"'";
                            document.getElementById('res').innerHTML='<button><a href="'+link+'">Click to check output.</a></button>'
                        }
                    }
                    let data={x:Number(x),y:Number(y)}
                    xhr.send(JSON.stringify(data));
                }
        </script>
    </html>
    `
    res.send(str);
})

publisher.listen(3333, () => {
    console.log('publisher server listening at 3333 port number');
})
