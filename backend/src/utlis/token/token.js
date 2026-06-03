import jwt from 'jsonwebtoken';
//// generate token
 export  const  generateToken = async ({payload,signature,options }={})=>{
     return jwt.sign( payload, signature, options);
 }

  export const verifyToken = ({token,signature}={}) => {
    return jwt.verify(
      token,
      signature
    );};