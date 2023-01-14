import { HttpClient } from "../lib";
import JsEncrypt from 'jsencrypt';
import axios from 'axios';
import { IOauth2Info } from "../lib/provider/types";


const apiHost = process.env.API_HOST;
const appId = process.env.APP_ID?process.env.APP_ID:'';
const appKey = process.env.APP_KEY;
const email = process.env.EMAIL;
const return_url = process.env.RETURN_URL;
const publicString = process.env.PUBLIC_KEY?process.env.PUBLIC_KEY:'';



export async function getToken(){
    let oauthIfno:any;
    let refreshToken = '';
    let httpclient: HttpClient;
    const headers = {
        'Content-Type': 'application/json',
        // 'Access-Token': this.accessToken,
    };
    let data = {
        email: email,
        password: getRSApass(process.env.PASSWORD),
        app_id: appId,
        return_url: return_url,
    };
    console.log('request code data:',data);
    // get code
    const resCode:any = await axios.post(`${apiHost}/api/v1/oauth2/get_code`, data, { headers });
    if (resCode.status === 200 && resCode.data.code === 200) {
        const resToken:any = await axios.get(`${apiHost}/api/v1/oauth2/access_token?app_id=${appId}&app_key=${appKey}&code=${resCode.data.data.code}`);
        // console.log(resToken)
        if (resToken.status === 200 && resToken.data.code === 200) {
            oauthIfno = resToken.data.data;
            console.log('get token:', oauthIfno.accessToken);
        }else {
            throw `get token err:${resToken.data.msg}`;
        }
    }else {
        throw `get code err:${resCode.data.msg}`;
    }
    function getRSApass(body:any, options?:any) {
        const jse = new JsEncrypt(options);
        jse.setPublicKey(publicString);
        const encrypted = jse.encrypt(body);
        return encrypted;
    }
    return oauthIfno;
}

export async function getClient(){
     const {accessToken,refreshToken} = await getToken();
     return  new HttpClient(appId, accessToken, refreshToken, 7200, '', 'test');

}
