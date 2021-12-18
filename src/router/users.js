const Router = require('express').Router();
const db_connection = require('../db_connection.js');


Router.post('/islogged', (req, res)=>{

    res.json({isLogged:req.session.email?1:0})
})

Router.post('/login', (req, res)=>{
    //VALIDATE LOGIN

    if(!req.session.email){
        if(req.body.email && req.body.pass){

            db_connection.validateLogin(req.body)
            .then(result=>{
                //LOGIN VALID
                if(result.success){
                    
                    req.session.email = req.body.email; 
                    req.session.user_id = result.user_id;
                    console.log("Entro un usuario "+req.session.id);
                    
                    res.json({success:true})
                }
    
                //WRONG DATA
                else{
    
                    //CHECKING EMAIL
                    if(result.validEmail){
    
                        //WRONG PASS
                        res.json({error:'WRONG PASSWORD'})
                    }else{
                        
                        //WRONG EMAIL AND PASS
                        res.json({error:'INVALID DATA'})
                    }
                    
                }
            })
            .catch(err=>{
                throw err;
            })
        }
        else{
            res.json({error:'invalid params'});
        }
    }
    
});
Router.get('/info', (req, res)=>{

    //VALIDATE LOGIN
    if(req.session.email){
        db_connection.getUserInfo(req.session.user_id)
        .then(user=>{
            if(user){
                res.json({success:true, user:user})
            }else{
                res.json({msg:"No user registered"})
            }
        })
        .catch(err=>{
            throw err;
        })
    }
    
});

Router.post('/register', (req, res)=>{

    //VALIDATE REGISTRO

    if(!req.session.email){
        if(
            req.body.nombre &&
            req.body.apellido &&
            req.body.email &&
            req.body.telefono &&
            req.body.pass
        ){
            db_connection.createUser(req.body)
            .then(result=>{
                if(result.success){
                    //SUCCESS
                    req.session.email = req.body.email; 
                    req.session.user_id = result.user_id;
                    res.json({success:true})
                }
                else{
                    //WRONG DATA
                    console.log("WRONG DATA");
                    
                    res.json(result);
                }
            })
            .catch(err=>{
                throw err;
            })
        }
        else{
            res.json({error: "invalid params"})
        }
    }else{
        res.json({msg:"FIRST LOGOUT"})
    }

    
});

Router.post('/logout', (req, res)=>{
    let sessionId = req.session.id;
    req.session.destroy((err)=>{
        if(err){
            
            res.json({error: err})
        }else{
            console.log("Usuario "+sessionId+" cerro sesion");
            res.json({success:true});
        }
        
    })
})


module.exports = Router;