// const requesthandler = () => {() => {}}
// const requesthandler = (fun) => () => {}
// const requesthandler = (fun) => async () => {}

const requesthandler = (fun) => async(req, res, next)=>{
    try {
        await fun(req, res,next)
    } catch (error) {
        res.status(error.code || 500).json({
            success : false,
            message: error.message
        })
    }
}

export {requesthandler};