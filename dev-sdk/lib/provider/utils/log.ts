import log from "loglevel"
if(process.env.NODE_ENV && (process.env.NODE_ENV != 'prod' && process.env.NODE_ENV != "production")) {
    log.setLevel("debug");
    log.debug("sdk env:",process.env.NODE_ENV);
}else{
    log.setLevel("error")
}

export default log