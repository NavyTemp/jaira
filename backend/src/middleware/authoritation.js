export const authorization =(accessRoules=[])=>{
    return (req,res,next)=>{
        if(!accessRoules.includes(req?.user?.role)){
           return res.status(403).json({ message: "Unauthorized access 😢" });

    }
    return next();
}}