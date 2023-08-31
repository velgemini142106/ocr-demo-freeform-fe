export function clientExec(callback){
    if(process.client){
        callback()
    }
}