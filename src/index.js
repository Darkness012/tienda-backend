require('dotenv').config();
const express = require('express');
const session = require("express-session");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8080;
const db_connection = require("./db_connection.js");
const usersRouter = require('./router/users.js');
const productosRouter = require('./router/productos.js');


//CONNECTING TO DATABASE
db_connection.initConnection();


//SETTINGS
app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cors({credentials: true, origin: true}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
    
}))


//ROUTER
app.use('/users', usersRouter);
app.use('/productos', productosRouter);

app.get('/images/:image', (req, res)=>{
    res.sendFile(__dirname+'/images/'+req.params.image+".jpg");
})

app.get("/*", (req, res)=>{ res.send("invalid") });


//STARTING SERVER
app.listen(port, () => console.log(`listening on port ${port}`));
