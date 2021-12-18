const mysql = require('mysql');
const hasher = require('password-hash');

class DBAdmin {
    constructor(){
        this.con = mysql.createConnection({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASS,
            database : process.env.DATABASE
        });
    }

    initConnection(){
        this.con.connect(function(err) {
            if (err) throw err;
            console.log("Connected to database!");
        });
    }

    //USUARIOS ADMIN

    //returns user or false
    getUserInfo(userID){
        return new Promise((resolve, reject)=>{
            this.con.query("SELECT nombre, apellido, email, telefono FROM usuario WHERE id ="+userID, 
            (err, results)=>{
                if(err) reject(err);

                if(results.length){
                    resolve(results[0]);
                }else{
                    resolve(false)
                }
                
            })
        })
    }
    //returns result.success or result.wrong_data
    createUser(userData){
        return new Promise((resolve, reject)=>{
            
            let hashedPass = hasher.generate(userData.pass);

            this.validateRegistro(userData)
            .then(result=>{

                //VALIDATING EMAIL AND PHONE
                if(!result.emailExists && !result.phoneExists){

                    //ADD THE NEW USER
                    let sentencia = `
                        INSERT INTO usuario (nombre, apellido, email, telefono, pass) 
                        VALUES ('${userData.nombre}', '${userData.apellido}', 
                                '${userData.email}', '${userData.telefono}', 
                                '${hashedPass}')`;

                    this.con.query(sentencia, (err, user_inserted)=>{
                        if(err) reject(err);

                        resolve({success: true, user_id:user_inserted.insertId});
                    })
                }else{
                    //WRONG EMAIL OR PHONE
                    resolve(result);
                }
            })
            .catch(err=>{
                //NOTIFY ERROR
                reject(err);
            })
        })
    }
    //returns result.emailExists and result.phoneExists
    validateRegistro(userData){
        return new Promise((resolve, reject)=>{
            this.con.query(`CALL validate_registro('${userData.email}', '${userData.telefono}')`, (err, result)=>{
                if(err) reject(err);

                resolve(result[0][0]);
            })
        });
    }
    //returns result.validEmail and result.validPass
    validateLogin(userData){

        return new Promise((resolve, reject)=>{

            let sentencia =  `SELECT id, count(*) as valid, pass FROM usuario where email = '${userData.email}'`;

            this.con.query(sentencia, (err, results)=>{
                if(err) reject(err);

                //VALID EMAIL
                if (results[0].valid) 
                {

                    //CHECKING PASs
                    if(hasher.verify(userData.pass, results[0].pass)){
                        resolve({success:true, user_id:results[0].id})
                    }else{
                        resolve({
                            validEmail:true
                        })
                    }
                }

                //INVALID EMAIL
                else
                {
                    resolve({success:false})
                }

            })
        });

    }

    //PRODUCTOS ADMIN
    getAllProducts(){
        return new Promise((resolve, reject)=>{
            let sentencia = 'SELECT* FROM producto';
            this.con.query(sentencia, (err, results)=>{
                if(err) reject(err);

                resolve(results);
            })
        })
    }
    //returns empyt or products
    getProducts(filtro){
        return new Promise((resolve, reject)=>{
            let sentencia = `SELECT* FROM producto WHERE nombre LIKE '%${filtro}%'`;
            this.con.query(sentencia, (err, results)=>{
                if(err) reject(err);

                if(results.length>0){
                    resolve({success:true,products:results});
                }else{
                    resolve({empty:true})
                }
            })
        })
    }
    getCarrito(user_id){
        return new Promise((resolve, reject)=>{
            this.con.query("SELECT* FROM pedido_detalles WHERE usuario_id = "+user_id, (err, results)=>{
                if(err) reject(err);

                resolve(results);
            })
        })
    }
    //returns result.updated or inserted
    hacerPedido(pedido){

        return new Promise((resolve, reject)=>{

            //VALIDAR SI EXISTE PEDIDO

            this.existePedido(pedido)
            .then(exists=>{


                //SI EXISTE, SUMA LA CANTIAD
                if(exists){

                    //UPDATE CURRENT
                    let sentencia = 
                        `UPDATE pedido SET cantidad = cantidad+${pedido.cantidad} 
                        WHERE usuario_id=${pedido.usuario_id} AND producto_id=${pedido.producto_id}`;

                    this.con.query(sentencia, (err)=>{
                        if (err) reject(err);
                        resolve({updated:true})
                    })
                }

                //SI NO EXISTE CREA UN PEDIDO 
                else{

                    //INSERT NEW
                    let sentencia = `INSERT INTO pedido VALUES(${pedido.usuario_id}, ${pedido.producto_id}, ${pedido.cantidad})`;
                    this.con.query(sentencia, (err)=>{
                        if (err) reject(err);
                        resolve({inserted:true})
                    });
                }
            })
            .catch(err=>{
                reject(err);
            })
        })

        //SAMPLE USAGE
        /*this.hacerPedido({
            usuario_id:1,
            producto_id:1,
            cantidad:4
        })
        .then(result=>{
            if(result.updated){
                //UPDATED
            }
            else{
                //INSERTED
            }
            console.log(result);
        })
        .catch(err=>{
            console.log(err);
        })*/
    }
    //returns bool exists
    existePedido(pedido){

        return new Promise((resolve, reject)=>{
            this.con.query(`CALL existe_pedido(${pedido.usuario_id},${pedido.producto_id})`, (err, results)=>{
                if(err) reject(err);
                
                console.log(results);
                resolve(results[0][0].count);
            })
        })

        
    }
    //returns returns count_removed
    eliminarPedido(pedido){
        return new Promise((resolve, reject)=>{

            this.con.query(`CALL eliminar_pedido(${pedido.usuario_id}, ${pedido.producto_id})`, 
            
            (err,result)=>{

                if(err) reject(err);    

                resolve(result[0][0].count_removed);
            })

        })

    }
    //returns returns count_removed
    cancelarCarrito(userID){

        return new Promise((resolve, reject)=>{
            this.con.query(`CALL cancelar_carrito(${userID})`, (err, result)=>{
                if(err) reject(err);

                resolve(result[0][0].count_removed);
            })
        })

        
    }
    //returns returns count_removed
    pagarCarrito(userID){
        return new Promise((resolve, reject)=>{
            let sentencia = `CALL pagar_carrito(${userID})`;

            this.con.query(sentencia, (err, result)=>{
                if(err) reject(err);

                resolve(result[0][0].count_removed);
            })
        })
    }
}

module.exports = new DBAdmin();