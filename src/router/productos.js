const Router = require('express').Router();
const db_connection = require('../db_connection.js');
const NOT_LOGGED = {isLogged:false};

Router.get('/', (req, res)=>{

    if(req.session.email){
        db_connection.getAllProducts()
        .then(results=>{

            respuesta  = {
                success: true,
                products:results
            }

            db_connection.getCarrito(req.session.user_id)
            .then(carrito=>{
                respuesta.carrito = carrito;
                res.json(respuesta);
            })
            .catch(err=>{
                throw err;
            })
            
        })
        .catch(err=>{
            res.json({err: err})
            throw err;
        })
    }else{
        res.json(NOT_LOGGED)
    }
    
})

Router.get("/carrito", (req, res)=>{
    if(req.session.email){
        db_connection.getCarrito(req.session.user_id)
        .then(results=>{
            res.json({pedidos: results})
        })
        .catch(err=>{
            throw err;
        })
    }
})

Router.get("/:filtro", (req, res)=>{

    if(req.session.email){
        db_connection.getProducts(req.params.filtro)
        .then(results=>{
            res.json(results);
        })
        .catch(err=>{
            throw err;
        })
    }else{
        res.json(NOT_LOGGED)
    }
    
})

Router.post('/carrito/nuevo-pedido', (req, res)=>{

    //NUEVO PEDIDO

    if(req.session.email){
        if(
            req.body.producto_id &&
            req.body.cantidad
        ){  
            req.body.usuario_id = req.session.user_id;

            db_connection.hacerPedido(req.body)
            .then(result=>{
    
                if(result.updated){
                    //UPDATED
                    res.json({success:"UPDATED"});
                }
                else{
                    //INSERTED
                    res.json({success:"INSERTED"});
                }
    
            })
            .catch(err=>{
                res.json({err:err});
                throw err;
            })
        }
        else{
            res.json({err:'invalid params'});
        }
    }else{
        res.json(NOT_LOGGED);
    }

    

});

Router.delete('/carrito/remove-pedido', (req, res)=>{

    //DELETE PEDIDO
    if(req.session.email){
        if(req.body.producto_id){
        
            db_connection.eliminarPedido({
                usuario_id: req.session.user_id,
                producto_id: req.body.producto_id
            })
            .then(count_removed=>{
    
                if(count_removed){
                    //DELETED
                    console.log(count_removed);
                    res.json({success:true})
                }
                else {
                    //DOES NOT EXISTS
                    res.json({msg:"does not exists"})
                }
            })
            .catch(err=>{
                res.json({err:err})
                throw err;
            })
        }
        else{
            res.json({err: "invalid params"})
        }
    }else{
        res.json(NOT_LOGGED);
    }

    
});

Router.delete('/carrito/cancelar', (req, res)=>{

    if(req.session.email){

        db_connection.cancelarCarrito(req.session.user_id)
            .then(count_removed=>{
                if(count_removed){
                    res.json({success:true})
                }else{
                    res.json({msg:"empty cart"});
                }
            })
            .catch(err=>{
                throw err;
            })
    }else{
        res.json(NOT_LOGGED)
    }
})

Router.delete('/carrito/pagar', (req, res)=>{
    
    //SE PAGARA PEDIDO
    if(req.session.email){
        db_connection.pagarCarrito(req.session.user_id)
            .then(count_removed=>{
                if(count_removed){
                    res.json({success:true});
                }else{
                    res.json({msg:"empty cart"})
                }
                
            })
            .catch(err=>{
                res.json({err:err});
            })
    }else{
        res.json(NOT_LOGGED)
    }
    

});


module.exports = Router;